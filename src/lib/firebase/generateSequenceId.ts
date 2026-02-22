"use server";
import { fireStore } from "@/firebase/server";

// Helper to pad numbers
const pad = (num: number, size = 4) => num.toString().padStart(size, "0");

// Function to generate order ID
export const generateSequenceId = async (
  forEntity: string
): Promise<string> => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = pad(now.getMonth() + 1, 2);
  const dd = pad(now.getDate(), 2);
  const hh = pad(now.getHours(), 2);
  const min = pad(now.getMinutes(), 2);

  const datePart = `${dd}${mm}${yy}`;
  const timePart = `${hh}${min}`;

  const counterRef = fireStore.collection("counters").doc(forEntity);

  const newCount = await fireStore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentCount = snapshot.exists ? snapshot.data()?.count || 0 : 0;
    const updatedCount = currentCount + 1;
    transaction.set(counterRef, { count: updatedCount }, { merge: true });
    return updatedCount;
  });
  const sequence = pad(newCount);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  const forEntityPrefix = forEntity === "orders" ? "MSC-ORD" : "MSC-ENQ"; // Add more entity types as needed
  const envPrefix = process.env.VERCEL_ENV === "production" ? "" : "D-";

  return `${envPrefix}${forEntityPrefix}-${datePart}-${timePart}-${sequence}-${randomPart}`;
};
