"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KeyRound, Loader, LockKeyhole } from "lucide-react";

export default function UsersUnlockDialog({
  children,
  open: openProp,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onUnlock() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-users/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passphrase }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data?.error ?? "Unlock failed");
        return;
      }

      setOpen(false);
      setPassphrase("");
      router.push("/admin-dashboard/users");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5" />
            Unlock User Management
          </DialogTitle>
          <DialogDescription>
            Enter the admin passphrase to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="bg-background w-full rounded-md border px-3 py-2"
            placeholder="Passphrase"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onUnlock} className="w-full" disabled={loading}>
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
