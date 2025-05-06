import { auth } from "@/firebase/server";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { email } = body;

  if (!email) return NextResponse.json({ error: "Email is required" });

  try {
    const user = await auth.getUserByEmail(email);
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.log({ error });

    return NextResponse.json({ exists: false }, { status: 404 });
  }
};
