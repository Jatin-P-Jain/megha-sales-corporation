import { fireStore } from "@/firebase/server";

export async function getAllCategories(): Promise<string[]> {
  const snapshot = await fireStore.collection("products").get();
  const set = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    set.add(data?.partCategory);
  });

  return Array.from(set).sort();
}
