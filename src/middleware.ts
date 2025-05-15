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
  // 5) Decode & check displayName
  const decoded = decodeJwt(token);
  const hasName =
    typeof decoded.name === "string" && decoded.name.trim().length > 0;

  // 6) Always allow the “get-user-details” page when logged in
  const isDetailsPage = pathname.startsWith("/get-user-details");

  // 7) If they’re missing a name, force them to details
  if (!hasName && !isDetailsPage) {
    // Preserve where they originally wanted to go
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/get-user-details?redirect=${redirectTo}`, origin),
    );
  }

  // 8) If they now have a name but somehow hit details, send them home
  if (hasName && isDetailsPage) {
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
    "/get-user-details",
    "/products-list",
  ],
};
