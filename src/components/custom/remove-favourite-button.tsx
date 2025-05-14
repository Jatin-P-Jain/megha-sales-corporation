"use client";
import { Button } from "../ui/button";
import { HeartOffIcon } from "lucide-react";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RemoveFavouriteButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  return (
    <Button
      variant={"outline"}
      size={"sm"}
      className="cursor-pointer"
      onClick={async () => {
        const tokenResult = await auth?.currentUser?.getIdTokenResult();
        if (!tokenResult) {
          return;
        }
        const token = tokenResult?.token;
        // await removeFavourite(propertyId, token);
        toast.success("Success!", {
          description: `Property ${"REMOVED from"} your favourites.`,
        });
        router.refresh();
      }}
    >
      <HeartOffIcon className="fill-red-600" />
    </Button>
  );
}
