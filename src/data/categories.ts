import { fireStore } from "@/firebase/server";

export async function getAllCategories(brandId?: string): Promise<string[]> {
  const set = new Set<string>();

  if (brandId) {
    // Fetch categories from a specific brand
    const snapshot = await fireStore.collection("brands").doc(brandId).get();
    const data = snapshot.data();
    if (Array.isArray(data?.partCategories)) {
      data.partCategories.forEach((c: string) => set.add(c));
    }
  } else {
    // Fetch categories from all brands
    const brandsSnapshot = await fireStore.collection("brands").get();
    brandsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (Array.isArray(data?.partCategories)) {
        data.partCategories.forEach((c: string) => set.add(c));
      }
    });
  }

  return Array.from(set).sort();
}
