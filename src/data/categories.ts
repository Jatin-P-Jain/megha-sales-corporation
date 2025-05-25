import { fireStore } from "@/firebase/server";

export async function getAllCategories(): Promise<string[]> {
  const snapshot = await fireStore.collection("brands").get();
  const set = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.partCategories)) {
      data.partCategories.forEach((c: string) => set.add(c));
    }
  });

  return Array.from(set).sort();
}
