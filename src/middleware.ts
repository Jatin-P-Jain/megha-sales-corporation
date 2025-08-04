// middleware.ts
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin, searchParams } = request.nextUrl;
  // ✅ Bypass auth for static public files
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  // 0) Bypass internals & your refresh endpoint
  if (
    request.method === "POST" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/refresh-token")
  ) {
    return NextResponse.next();
  }

  // 1) Grab the ID token or treat as logged-out
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    const publicPaths = ["/", "/login", "/register", "/products-list"];
    const isPublic =
      publicPaths.includes(pathname) || pathname.startsWith("/brands");
    const isAccountPage = pathname.startsWith("/account/profile");

    if (isPublic || isAccountPage) return NextResponse.next();
    // ADD THIS:
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("deepLink", "1");
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    return res;
  }

  // 2) Block /login & /register when already logged in
  if ((pathname === "/login" || pathname === "/register") && token) {
    const hasRedirect = searchParams.get("redirect");
    if (!hasRedirect) {
      return NextResponse.redirect(new URL("/", origin));
    } // else allow to render login, so client can redirect to correct page
  }

  // 3) Decode your token
  const { profileComplete, admin, exp } = decodeJwt(token) as {
    profileComplete?: boolean;
    admin?: boolean;
    exp?: number;
  };

  // 4) If your token’s about to expire, refresh it (once)
  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin),
    );
  }

  // 5) Profile‐complete dance
  if (!profileComplete) {
    const didRefreshOnce = searchParams.get("refreshed") === "1";

    if (!didRefreshOnce) {
      // First pass → force a token‐refresh, tag with ?refreshed=1
      const url = new URL(request.url);
      url.searchParams.set("refreshed", "1");
      return NextResponse.redirect(
        new URL(
          `/api/refresh-token?redirect=${encodeURIComponent(
            url.pathname + url.search,
          )}`,
          origin,
        ),
      );
    }

    // Second pass → still no profileComplete? Lock them onto /account/profile
    if (pathname !== "/account/profile") {
      return NextResponse.redirect(new URL("/account/profile", origin));
    }

    // If they *are* on /account/profile, allow render
    return NextResponse.next();
  }

  // 6) If they’ve now completed the profile but are stuck on /account/profile, bounce on
  if (profileComplete && pathname === "/account/profile") {
    const back = "/";
    return NextResponse.redirect(new URL(back, origin));
  }

  // 7) Admin vs user guards
  if (!admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (admin && pathname === "/admin-dashboard") {
    return NextResponse.redirect(new URL("/admin-dashboard/brands", origin));
  }
  if (admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 8) All clear
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/",
    "/admin-dashboard",
    "/admin-dashboard/:path*",
    "/login",
    "/register",
    "/account",
    "/account/:path*",
    "/products-list",
    "/products-list/:path*",
    "/cart",
    "/checkout",
    "/order-history",
    "/brands/:path*",
  ],
};
