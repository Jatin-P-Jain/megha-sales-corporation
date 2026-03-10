"use server";

import { fireStore } from "@/firebase/server";
import { FeedbackUser } from "@/types/user";

export const saveFeedback = async ({
  user,
  rating,
  message,
}: {
  user: FeedbackUser;
  rating: number;
  message: string;
}) => {
  try {
    const feedbackRef = fireStore.collection("feedbacks").doc(user.id);
    await feedbackRef.set({
      user,
      rating,
      message,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to save feedback for user ${user.id}:`, error);
    return { success: false, error: (error as Error).message };
  }
};
