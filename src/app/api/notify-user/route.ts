import { fireStore, messaging } from "@/firebase/server";
import { MulticastMessage } from "firebase-admin/messaging";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid, title, body, url, clickAction, customData } = await req.json();

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

    const message: MulticastMessage = {
      data: {
        title,
        body,
        url,
        click_action: clickAction || "",
        order_id: customData.order_id,
        status: customData.status,
        tracking_number: customData.tracking_number,
        category: customData.category,
        timestamp: Date.now().toString(),
      },
      // webpush: {
      //   fcmOptions: {
      //     link: url, // ← use camelCase
      //   },
      //   notification: {
      //     // optional WebPush notification options
      //     icon: "/icons/icon-192x192.png",
      //     badge: "/icons/icon-192x192.png",
      //     requireInteraction: true,
      //     tag: "notification-tag",
      //   },
      // },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log("✅ FCM notification sent:", response);

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
