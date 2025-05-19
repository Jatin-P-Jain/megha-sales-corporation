// middleware.ts
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;

  // 0) Bypass POSTs, Next.js internals, and your refresh endpoint
  if (
    request.method === "POST" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/refresh-token")
  ) {
    return NextResponse.next();
  }

  // 1) Grab the raw ID‐token from the cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  // 2) If no token at all, treat as “not logged in”
  const publicPaths = ["/", "/login", "/register", "/products-list"];
  if (!token) {
    // allow public pages
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }
    // any other page requires login
    return NextResponse.redirect(new URL("/login", origin));
  }

  // From here on, TS knows token is a `string`
  // 3) Prevent logged‐in users from hitting /login or /register
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 4) Decode your JWT and extract claims
  const { profileComplete, admin, exp } = decodeJwt(token) as {
    profileComplete?: boolean;
    admin?: boolean;
    exp?: number;
  };

  // 5) If the token is about to expire (within 5m) or already has, refresh it
  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    const redirectTo = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin),
    );
  }

  // 6) If profile isn’t complete yet, send them through your refresh-route dance
  if (!profileComplete) {
    // but don’t block the actual profile page
    if (pathname === "/account/profile") {
      return NextResponse.next();
    }
    const redirectTo = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin),
    );
  }

  // 7) If they’ve just finished the profile page, bounce them on
  if (profileComplete && pathname === "/account/profile") {
    const back = request.nextUrl.searchParams.get("redirect") ?? "/";
    return NextResponse.redirect(new URL(back, origin));
  }

  // 8) Admin vs. user guards
  if (!admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (admin && pathname === "/admin-dashboard") {
    return NextResponse.redirect(new URL("/admin-dashboard/brands", origin));
  }
  if (admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 9) All clear
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin-dashboard",
    "/admin-dashboard/:path*",
    "/login",
    "/register",
    "/account",
    "/account/:path*",
    "/products-list",
  ],
};
