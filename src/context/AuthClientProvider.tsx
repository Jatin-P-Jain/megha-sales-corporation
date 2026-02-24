"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/context/useAuth"; // or auth-context
import AuthEffects from "@/context/AuthEffects";
import { auth } from "@/firebase/client";

import {
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { UserGateProvider } from "./UserGateProvider";
import { UserProfileProvider } from "./UserProfileProvider";

async function setupAuthPersistence() {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
    return;
  } catch {}
  try {
    await setPersistence(auth, browserLocalPersistence);
    return;
  } catch {}
  try {
    await setPersistence(auth, browserSessionPersistence);
  } catch {}
}

export default function AuthClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupAuthPersistence();
  }, []);

  return (
    <AuthProvider>
      <UserGateProvider>
        <UserProfileProvider>
          <AuthEffects />
          {children}
        </UserProfileProvider>
      </UserGateProvider>
    </AuthProvider>
  );
}
