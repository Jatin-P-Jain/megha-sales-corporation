import { fireStore, messaging } from "@/firebase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid, title, body } = await req.json();

    if (!uid || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Get all FCM tokens for the user
    const tokensSnapshot = await fireStore
      .collection(`users/${uid}/fcmTokens`)
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => doc.id);

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: "No FCM tokens found" },
        { status: 404 },
      );
    }

    // 2. Construct message with both notification and data
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
      },
      tokens,
    };

    // 3. Send multicast notification
    const response = await messaging.sendEachForMulticast(message);

    // 4. Delete failed tokens
    const failedTokens = response.responses
      .map((res, idx) => (!res.success ? tokens[idx] : null))
      .filter(Boolean);

    await Promise.all(
      failedTokens.map((token) =>
        fireStore.doc(`users/${uid}/fcmTokens/${token}`).delete(),
      ),
    );

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      failedTokens,
    });
  } catch (err) {
    console.error("❌ Error sending FCM notification:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
