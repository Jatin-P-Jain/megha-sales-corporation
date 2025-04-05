"use client";

import { addFavourite, removeFavourite } from "@/app/property-search/actions";
import { useAuth } from "@/context/auth";
import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const FavouriteButton = ({
  propertyId,
  isFavourite,
}: {
  propertyId: string;
  isFavourite: boolean;
}) => {
  const auth = useAuth();
  const router = useRouter();
  return (
    <div
      className="bg-white w-8 h-8 absolute top-0 right-0 rounded-bl-2xl cursor-pointer flex items-center justify-center z-10 "
      onClick={async () => {
        try {
          const tokenResult = await auth?.currentUser?.getIdTokenResult();
          if (!tokenResult) {
            router.push("/login");
            return;
          }
          const token = tokenResult?.token;
          if (!isFavourite) {
            await addFavourite(propertyId, token);
          } else {
            await removeFavourite(propertyId, token);
          }
          toast.success("Success!", {
            description: `Property ${
              isFavourite ? "REMOVED from" : "ADDED to"
            } your favourites.`,
          });
          router.refresh();
        } catch (e) {
          console.log("e -- ", e);
          toast.error("Error!", { description: "An error occurred" });
        }
      }}
    >
      <HeartIcon
        className={`${
          isFavourite ? "fill-red-500" : "transparent"
        } stroke-sky-900`}
        size="20"
      />
    </div>
  );
};
export default FavouriteButton;
