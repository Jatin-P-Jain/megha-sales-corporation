"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import UsersUnlockDialog from "./users-unlock-dailog";

export default function UsersCardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const shouldAutoOpen = useMemo(
    () => searchParams.get("unlock") === "users",
    [searchParams],
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldAutoOpen) setOpen(true);
  }, [shouldAutoOpen]);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    // Optional: remove ?unlock=users from the URL after opening/closing
    if (!nextOpen && shouldAutoOpen) {
      router.replace("/admin-dashboard");
    }
  }

  return (
    <UsersUnlockDialog open={open} onOpenChange={onOpenChange}>
      <Button className="w-full">
        <Users className="mr-2 h-4 w-4" />
        Manage Users
      </Button>
    </UsersUnlockDialog>
  );
}
