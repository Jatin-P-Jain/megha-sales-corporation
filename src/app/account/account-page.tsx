"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytesResumable } from "firebase/storage";

import { storage } from "@/firebase/client";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { useAuthActions, useAuthState } from "@/context/useAuth";
import type { AccountStatus, UserData } from "@/types/user";

import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useLinkAuthProviders } from "@/hooks/useLinkAuthProviders";
import { setToken } from "@/context/actions";
import { updateUserFirebaseMethods, updateUserPhoto } from "./actions";
import AccountView from "./account-view";
import Loading from "./loading";

type AccountStatusUI = Exclude<AccountStatus, never>;

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { clientUser, clientUserLoading, currentUser } = useAuthState();
  const { setClientUser, refreshClientUser } = useAuthActions();

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [photo, setPhoto] = useState<string>("");
  const [moreOpen, setMoreOpen] = useState(false);

  const recaptchaVerifier = useRecaptcha({ enabled: true });
  const { linkGoogle } = useLinkAuthProviders({
    user: currentUser,
    recaptchaVerifier: recaptchaVerifier.verifier,
    onToken: async (idToken, refreshToken) => {
      await setToken(idToken, refreshToken);
    },
    onLinked: async () => {
      await updateUserFirebaseMethods();
      await refreshClientUser();
    },
    toast,
  });

  useEffect(() => {
    if (clientUser?.photoUrl) setPhoto(clientUser.photoUrl);
  }, [clientUser?.photoUrl]);

  const isAdmin = clientUser?.userType === "admin";

  const accountStatus: AccountStatusUI = useMemo(
    () => (clientUser?.accountStatus ?? "pending") as AccountStatusUI,
    [clientUser?.accountStatus],
  );

  const onGoToProfile = useCallback(() => {
    const redirectTo = searchParams.get("redirect") ?? "/account";
    const profileUrl = new URL("/account/profile", window.location.origin);
    profileUrl.searchParams.set("redirect", redirectTo);
    router.push(profileUrl.toString());
  }, [router, searchParams]);

  const onCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (e) {
      console.error("Copy failed", e);
      toast.error("Failed to copy");
    }
  }, []);

  const onPhotoChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!clientUser?.uuid) return;

      const file = event.target.files?.[0];
      if (!file) return;

      // Optimistic preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setPhoto(e.target.result as string);
      };
      reader.readAsDataURL(file);

      const imagePath = `users/${clientUser.userId}/profile-picture/${Date.now()}-${file.name}`;
      const logoStorageRef = ref(storage, imagePath);

      setUploading(true);
      setUploadPercent(0);

      try {
        const task = uploadBytesResumable(logoStorageRef, file);

        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (snapshot) => {
              const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              );
              setUploadPercent(percent);
            },
            (error) => reject(error),
            () => resolve(),
          );
        });

        await updateUserPhoto({ userId: clientUser.uuid, photoUrl: imagePath });

        const formatted = imageUrlFormatter(imagePath);
        setPhoto(formatted);
        setClientUser((prev) =>
          prev ? ({ ...prev, photoUrl: formatted } as UserData) : prev,
        );

        toast.success("Profile updated!", {
          description: "New profile picture is set for your account.",
        });
      } catch (error) {
        console.error("Upload/update failed", error);
        toast.error("Failed to update profile picture", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setUploading(false);
      }
    },
    [clientUser, setClientUser],
  );

  if (clientUserLoading || !clientUser) {
    // Return a lightweight shell instead of null (reduces "blank feeling").
    return <Loading />;
  }

  return (
    <AccountView
      clientUser={clientUser}
      isAdmin={!!isAdmin}
      accountStatus={accountStatus}
      moreOpen={moreOpen}
      setMoreOpen={setMoreOpen}
      photo={photo}
      uploading={uploading}
      uploadPercent={uploadPercent}
      onPhotoChange={onPhotoChange}
      onGoToProfile={onGoToProfile}
      onCopy={onCopy}
      onLinkGoogle={async () => {
        await linkGoogle();
      }}
      onLinkPhone={() => {}}
    />
  );
}
