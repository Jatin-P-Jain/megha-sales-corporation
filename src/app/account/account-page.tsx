"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytesResumable } from "firebase/storage";

import { storage } from "@/firebase/client";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { useAuthState } from "@/context/useAuth";

import { useLinkAuthProviders } from "@/hooks/useLinkAuthProviders";
import { setToken } from "@/context/actions";
import { updateUserFirebaseMethods, updateUserPhoto } from "./actions";
import { updateUserProfile } from "./profile/action";
import AccountView from "./account-view";
import type { BusinessProfile } from "@/types/user";
import Loading from "./loading";
import { useUserGate } from "@/context/UserGateProvider";
import {
  useUserProfileActions,
  useUserProfileState,
} from "@/context/UserProfileProvider";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useSafeRouter } from "@/hooks/useSafeRouter";

export default function AccountPage() {
  const router = useSafeRouter();
  const searchParams = useSearchParams();

  useRequireUserProfile(true);

  const { currentUser, isAdmin } = useAuthState();
  const { refreshUser } = useUserProfileActions();
  const { clientUser, clientUserLoading } = useUserProfileState();
  const { accountStatus, rejectionReason, profileComplete, userRole } =
    useUserGate();

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [photo, setPhoto] = useState<string>("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");

  const { linkGoogle } = useLinkAuthProviders({
    user: currentUser,
    recaptchaVerifier: null, // Google link uses popup — no reCAPTCHA needed
    onToken: async (idToken, refreshToken) => {
      await setToken(idToken, refreshToken);
    },
    onLinked: async () => {
      await updateUserFirebaseMethods();
      await refreshUser();
    },
    toast,
  });

  useEffect(() => {
    if (clientUser?.photoUrl) setPhoto(clientUser.photoUrl);
  }, [clientUser?.photoUrl]);

  const onGoToProfile = useCallback(() => {
    const redirectTo = getSafeRedirectPath(
      searchParams.get("redirect"),
      "/account",
    );
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

  const onPhotoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after cancel
    event.target.value = "";
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropSrc(e.target.result as string);
        setCropOpen(true);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onSaveName = useCallback(
    async (name: string) => {
      await updateUserProfile({ displayName: name });
      await refreshUser();
      toast.success("Name updated!");
    },
    [refreshUser],
  );

  const onSavePan = useCallback(
    async (pan: string) => {
      await updateUserProfile({ panNumber: pan, businessIdType: "pan" });
      await refreshUser();
      toast.success("PAN number saved!");
    },
    [refreshUser],
  );

  const onSaveGst = useCallback(
    async (businessProfile: BusinessProfile) => {
      await updateUserProfile({
        gstNumber: businessProfile.gstin,
        businessIdType: "gst",
        firmName: businessProfile.tradeName,
        businessProfile,
      });
      await refreshUser();
      toast.success("GST details saved!");
    },
    [refreshUser],
  );

  const onCropDone = useCallback(
    async ({ file }: { blobUrl: string; file: File }) => {
      if (!clientUser?.uid) return;

      const imagePath = `users/${clientUser.uid}/profile-picture/${Date.now()}-${file.name}`;
      const logoStorageRef = ref(storage, imagePath);

      // Optimistic preview from blob
      const previewUrl = URL.createObjectURL(file);
      setPhoto(previewUrl);

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

        await updateUserPhoto({ userId: clientUser.uid, photoUrl: imagePath });
        const formatted = imageUrlFormatter(imagePath);
        URL.revokeObjectURL(previewUrl);
        setPhoto(formatted);

        toast.success("Profile updated!", {
          description: "New profile picture is set for your account.",
        });
      } catch (error) {
        console.error("Upload/update failed", error);
        setPhoto(clientUser.photoUrl ?? "");
        toast.error("Failed to update profile picture", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setUploading(false);
      }
    },
    [clientUser],
  );

  if (clientUserLoading || !clientUser) {
    // Return a lightweight shell instead of null (reduces "blank feeling").
    return <Loading />;
  }

  return (
    <AccountView
      clientUser={clientUser}
      profileComplete={profileComplete}
      isAdmin={!!isAdmin}
      userRole={userRole}
      accountStatus={accountStatus}
      rejectionReason={rejectionReason}
      photo={photo}
      uploading={uploading}
      uploadPercent={uploadPercent}
      onPhotoChange={onPhotoChange}
      cropOpen={cropOpen}
      cropSrc={cropSrc}
      onCropClose={() => setCropOpen(false)}
      onCropDone={onCropDone}
      onSaveName={onSaveName}
      onSavePan={onSavePan}
      onSaveGst={onSaveGst}
      onGoToProfile={onGoToProfile}
      onCopy={onCopy}
      onLinkGoogle={async () => {
        await linkGoogle();
      }}
      onLinkPhone={() => {}}
    />
  );
}
