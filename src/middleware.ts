import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, origin, searchParams } = request.nextUrl;

  // 0) Static/public bypass
  if (
    pathname === "/firebase-messaging-sw.js" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 1) Bypass API routes & POSTs entirely
  if (request.method === "POST" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2) Grab the ID token or treat as logged-out
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  const publicPaths = ["/", "/login", "/register", "/products-list"];
  const isPublic =
    publicPaths.includes(pathname) || pathname.startsWith("/brands");

  if (!token) {
    if (isPublic) return NextResponse.next();

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("deepLink", "1");
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);

    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    res.cookies.delete("firebaseAuthRefreshToken");
    return res;
  }

  // 3) Block /login & /register when already logged in
  if ((pathname === "/login" || pathname === "/register") && token) {
    const hasRedirect = searchParams.get("redirect");
    if (!hasRedirect) {
      return NextResponse.redirect(new URL("/", origin));
    }
  }

  // 4) Decode your token (admin, exp, profileComplete from custom claim)
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
    const redirectUrl = new URL("/login", origin);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    res.cookies.delete("firebaseAuthRefreshToken");
    return res;
  }

  // 5) If your token's about to expire, refresh it
  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/api/refresh-token?redirect=${redirectTo}`, origin)
    );
  }

  // 6) Admin unlock guard
  if (pathname.startsWith("/admin-dashboard/users")) {
    const unlocked = request.cookies.get("users_admin_unlock")?.value;
    if (unlocked !== "1") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-dashboard";
      url.searchParams.set("unlock", "users");
      return NextResponse.redirect(url);
    }
  }

  // 8) Admin vs user guards
  if (!admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // 9) All clear
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
