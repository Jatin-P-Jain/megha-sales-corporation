import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.method === "POST") {
    return NextResponse.next();
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    console.log("here -- ");

    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const decodedToken = decodeJwt(token);
  if (!decodedToken.admin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-dashboard", "/admin-dashboard/:path*", "/login"],
};
