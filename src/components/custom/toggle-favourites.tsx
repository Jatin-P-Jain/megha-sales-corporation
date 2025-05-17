"use client";

import { useAuth } from "@/context/useAuth";
import { HeartIcon, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const FavouriteButton = ({ isFavourite }: { isFavourite: boolean }) => {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="absolute top-0 right-0 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-bl-2xl bg-white"
      onClick={async () => {
        setLoading(true);
        try {
          const tokenResult = await auth?.currentUser?.getIdTokenResult();
          if (!tokenResult) {
            window.location.assign("/login");
            setLoading(false);
            return;
          }

          toast.success("Success!", {
            description: `Property ${
              isFavourite ? "REMOVED from" : "ADDED to"
            } your favourites.`,
          });
          router.refresh();
        } catch (e) {
          setLoading(false);
          console.log("e -- ", e);
          toast.error("Error!", { description: "An error occurred" });
        }
      }}
    >
      {!loading ? (
        <HeartIcon
          className={`${
            isFavourite ? "fill-red-500" : "transparent"
          } stroke-cyan-900`}
          size="20"
        />
      ) : (
        <LoaderCircleIcon className="animate-spin" size="20" />
      )}
    </div>
  );
};
export default FavouriteButton;
