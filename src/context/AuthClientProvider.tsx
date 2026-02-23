"use client";

import React from "react";
import { AuthProvider } from "@/context/useAuth"; // your provider file
import AuthEffects from "@/context/AuthEffects";

export default function AuthClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthEffects />
      {children}
    </AuthProvider>
  );
}
