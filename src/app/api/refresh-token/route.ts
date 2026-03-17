import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export const GET = async (request: NextRequest) => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY;
  const path = getSafeRedirectPath(
    request.nextUrl.searchParams.get("redirect")
  );
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("firebaseAuthRefreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!apiKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://secureToken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const jsonResponse = await response.json();
    if (!response.ok || !jsonResponse?.id_token) {
      throw new Error("Token refresh failed");
    }

    const newToken = jsonResponse.id_token;
    cookieStore.set("firebaseAuthToken", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return NextResponse.redirect(new URL(path, request.url));
  } catch {
    console.error("Failed to refresh token");
    return NextResponse.redirect(new URL("/", request.url));
  }
};
