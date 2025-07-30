"use client";

import GoogleOneTap from "@/components/custom/google-one-tap";
import { useAuth } from "@/context/useAuth";

export default function GoogleOneTapWrapper() {
  const { currentUser, loading } = useAuth();

  // Show nothing while auth is loading
  if (loading) return null;

  // Don't show One Tap if user is already logged in
  if (currentUser) return null;

  return <GoogleOneTap />;
}
