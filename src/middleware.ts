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
  // Bypass internals & your refresh endpoint
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

    if (isPublic) return NextResponse.next();

    // Clear any remaining cookies and redirect to login
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("deepLink", "1");
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    res.cookies.delete("firebaseAuthRefreshToken"); // Also clear refresh token
    return res;
  }

  // 2) Block /login & /register when already logged in
  if ((pathname === "/login" || pathname === "/register") && token) {
    const hasRedirect = searchParams.get("redirect");
    if (!hasRedirect) {
      return NextResponse.redirect(new URL("/", origin));
    }
  }

  // 3) Decode your token
  let profileComplete, admin, exp;
  try {
    const decoded = decodeJwt(token) as {
      profileComplete?: boolean;
      admin?: boolean;
      exp?: number;
    };
    profileComplete = decoded.profileComplete;
    admin = decoded.admin;
    exp = decoded.exp;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    // Token is invalid, treat as logged out
    const redirectUrl = new URL("/login", origin);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    res.cookies.delete("firebaseAuthRefreshToken");
    return res;
  }

  // 4) If your token's about to expire, refresh it
  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin),
    );
  }

  // 5) Profile‐complete dance - FIXED LOGIC
  if (!profileComplete) {
    const didRefreshOnce = searchParams.get("refreshed") === "1";

    // If user is on /account/profile and profile is not complete, allow them to stay
    if (pathname === "/account/profile") {
      return NextResponse.next();
    }

    if (!didRefreshOnce) {
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
    return NextResponse.redirect(new URL("/account/profile", origin));
  }

  // 6) If they've completed the profile but are on /account/profile, only redirect if they're not intentionally there
  if (profileComplete && pathname === "/account/profile") {
    // Don't auto-redirect away from profile page - let them stay if they want
    return NextResponse.next();
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
