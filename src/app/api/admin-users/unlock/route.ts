import { NextResponse } from "next/server";
import crypto from "node:crypto";

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  const expected = process.env.ADMIN_USERS_PASSPHRASE;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Missing ADMIN_USERS_PASSPHRASE in env." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const passphrase = String(body?.passphrase ?? "");

  if (!passphrase || !safeEqual(passphrase, expected)) {
    return NextResponse.json(
      { ok: false, error: "Invalid passphrase." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // 30 minutes
  res.cookies.set("users_admin_unlock", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  return res;
}
