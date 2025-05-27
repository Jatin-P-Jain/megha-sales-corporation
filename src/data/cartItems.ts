import { fireStore } from "@/firebase/server";

export const getCartProductIds = async (userId?: string) => {
  if (!userId) {
    return [];
  }
  const cartProductIdsSnapshot = await fireStore
    .collection("carts")
    .doc(userId)
    .collection("items")
    .get();
  const cartProductIds = cartProductIdsSnapshot.docs.map((doc) => doc.id);
  return cartProductIds;
};
