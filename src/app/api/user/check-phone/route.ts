import { auth } from "@/firebase/server";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { phone } = body;
  console.log({ phone });

  if (!phone) return NextResponse.json({ error: "Mobile is required" });

  try {
    const user = await auth.getUserByPhoneNumber("+91" + phone);
    console.log({ user });
    console.log({ exists: !!user });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.log({ error });
    return NextResponse.json({ exists: false }, { status: 404 });
  }
};
