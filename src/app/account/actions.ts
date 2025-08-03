"use server";
import { fireStore } from "@/firebase/server";
import imageUrlFormatter from "@/lib/image-urlFormatter";

export const updateUser = async ({
  userId,
  photoUrl,
}: {
  userId: string;
  photoUrl: string;
}) => {
  if (!userId) return;
  try {
    const userRef = fireStore.collection("users").doc(userId);
    console.log({ userRef });
    const imageUrl = imageUrlFormatter(photoUrl);
    userRef.update({ photoUrl: imageUrl });
  } catch (error) {
    console.log("Error while updating the user -- ", { error });
  }
};
