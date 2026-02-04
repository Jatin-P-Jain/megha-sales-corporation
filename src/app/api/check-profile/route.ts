import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      console.log("❌ No token in check-profile");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token with admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log("🔍 Checking profile for user:", uid);

    // Get user from Firestore
    const userDoc = await fireStore.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      console.log("❌ User doc does not exist, profile incomplete");
      return NextResponse.json({ profileComplete: false }, { status: 200 });
    }

    const userData = userDoc.data();
    const profileComplete = userData?.profileComplete ?? false;

    console.log("✅ Profile complete status:", profileComplete);

    return NextResponse.json(
      { profileComplete },
      {
        status: 200,
        headers: {
          // Prevent caching to ensure fresh data
          "Cache-Control": "no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("❌ Check profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
