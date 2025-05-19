import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin, searchParams } = request.nextUrl;

  // 1) Let POSTs through immediately
  if (request.method === "POST") {
    return NextResponse.next();
  }

  // 2) Grab the token
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token && pathname.startsWith("/account")) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  // 3) Public‐routes that never require login
  const publicPaths = ["/", "/login", "/register", "/products-list"];
  if (!token && publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 4) If no token at all, send them to /login
  if (token === undefined) {
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (
    token &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(new URL("/", origin));
  }
  // 5) Decode & check displayName
  const decoded = decodeJwt(token);

  const isProfileComplete = decoded?.profileComplete;

  const isProfileCompletePage = pathname.startsWith("/account/profile");

  if (!isProfileComplete && !isProfileCompletePage) {
    // Preserve where they originally wanted to go
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/account/profile?redirect=${redirectTo}`, origin),
    );
  }

  // 8) If they now have a name but somehow hit details, send them home
  if (isProfileComplete && isProfileCompletePage) {
    // If you passed a redirect param, use it; otherwise just go “/”
    const back = searchParams.get("redirect");
    return NextResponse.redirect(new URL(back ?? "/", origin));
  }
  // 9) Now continue with your expiry check, admin guards, etc.
  if (decoded.exp && (decoded.exp - 5 * 60) * 1000 < Date.now()) {
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin),
    );
  }

  // 10) Admin vs user guards
  if (!decoded.admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (decoded.admin && pathname === "/admin-dashboard") {
    return NextResponse.redirect(new URL("/admin-dashboard/brands", origin));
  }
  if (decoded.admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 11) All clear
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
    "/account/profile",
    "/products-list",
  ],
};
