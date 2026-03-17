import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const jwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

type VerifiedClaims = {
  admin?: boolean;
  exp?: number;
};

const verifyFirebaseIdToken = async (
  token: string
): Promise<VerifiedClaims | null> => {
  if (!projectId) {
    console.error(
      "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID for middleware auth"
    );
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return {
      admin: Boolean(payload.admin),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
};

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
  const token = request.cookies.get("firebaseAuthToken")?.value;

  const publicPaths = ["/", "/login", "/register", "/products-list"];
  const isPublic =
    publicPaths.includes(pathname) || pathname.startsWith("/brands");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isPublic && !isAuthPage) {
    return NextResponse.next();
  }

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
    const safeRedirect = getSafeRedirectPath(searchParams.get("redirect"));
    return NextResponse.redirect(new URL(safeRedirect, origin));
  }

  // 4) Verify token signature/claims before trusting role or expiry data
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    const redirectUrl = new URL("/login", origin);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete("firebaseAuthToken");
    res.cookies.delete("firebaseAuthRefreshToken");
    return res;
  }

  const { admin, exp } = verified;

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
    "/admin-dashboard/:path*",
    "/login",
    "/register",
    "/account/:path*",
    "/cart",
    "/checkout",
    "/order-history",
    "/enquiries",
    "/enquiries/:path*",
  ],
};
