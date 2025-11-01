import { fireStore } from "@/firebase/server";

export async function getAllCategories(brandId: string): Promise<string[]> {
  const snapshot = await fireStore.collection("brands").doc(brandId).get();
  const set = new Set<string>();
  const data = snapshot.data();
  if (Array.isArray(data?.partCategories)) {
    data.partCategories.forEach((c: string) => set.add(c));
  }

  return Array.from(set).sort();
}
