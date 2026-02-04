import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin, searchParams } = request.nextUrl;

  // ✅ Bypass auth for static public files
  if (
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
    pathname.startsWith("/api/refresh-token") ||
    pathname.startsWith("/api/check-profile") ||
    pathname.startsWith("/api/") // Bypass all API routes
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
    res.cookies.delete("firebaseAuthRefreshToken");
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
  let admin: boolean | undefined;
  let exp: number | undefined;

  try {
    const decoded = decodeJwt(token) as {
      admin?: boolean;
      exp?: number;
      user_id?: string;
    };
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

  // 5) Profile‐complete check - NOW USING DB VALUE
  // Skip profile check for /account/profile itself
  if (pathname !== "/account/profile") {
    try {
      // ✅ IMPORTANT: Use absolute URL for fetch in middleware
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;
      const checkUrl = new URL("/api/check-profile", baseUrl);

      const checkRes = await fetch(checkUrl.toString(), {
        headers: {
          Cookie: `firebaseAuthToken=${token}`,
        },
        // Add cache control to prevent stale data
        cache: "no-store",
      });

      if (checkRes.ok) {
        const { profileComplete } = await checkRes.json();

        if (!profileComplete) {
          console.log("❌ Profile incomplete, redirecting to /account/profile");
          // Profile not complete, redirect to profile page
          return NextResponse.redirect(new URL("/account/profile", origin));
        } else {
          console.log("✅ Profile complete, allowing access");
        }
      } else {
        console.error("Profile check API returned error:", checkRes.status);
      }
    } catch (error) {
      console.error("Profile check failed:", error);
      // On error, allow through to avoid blocking legitimate users
    }
  }

  // 6) Admin vs user guards
  if (!admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 7) All clear
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
