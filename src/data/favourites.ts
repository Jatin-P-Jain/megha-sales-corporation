import { auth, fireStore } from "@/firebase/server";
import { cookies } from "next/headers";
import "server-only";

const getUserFavourites = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) {
    return {};
  }
  const verifiedToken = await auth.verifyIdToken(token);
  if (!verifiedToken) {
    return {};
  }

  const favouritesDataSnapshot = await fireStore
    .collection("favourites")
    .doc(verifiedToken.uid)
    .get();
  const favouritesData = favouritesDataSnapshot.data();
  return favouritesData || {};
};
export default getUserFavourites;
