"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/firebase/client";
import type { UserData } from "@/types/user";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";
import { generateSequenceId } from "@/lib/firebase/generateSequenceId";

type UserProfileState = {
  clientUserLoading: boolean;
  clientUser: UserData | null;
  subscribed: boolean;
};

type UserProfileActions = {
  requireProfile: () => () => void; // returns release function
  refreshUser: () => Promise<UserData | null>;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
};

const StateCtx = createContext<UserProfileState | null>(null);
const ActionsCtx = createContext<UserProfileActions | null>(null);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const countRef = useRef(0);
  const unsubRef = useRef<null | (() => void)>(null);
  const uidRef = useRef<string | null>(null);

  const stopListener = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    uidRef.current = null;
    setLoading(false);
  }, []);

  const ensureUserDoc = useCallback(async (fbUid: string) => {
    // This is your old “first time userId” logic, moved off the auth-critical path.
    const userDocRef = doc(firestore, "users", fbUid);
    const snap = await getDoc(userDocRef);
    const data = snap.exists() ? snap.data() : null;
    const existingUserId = data && data.userId ? data.userId : null;
    const finalUserId = existingUserId ?? (await generateSequenceId("users"));

    const safeUser: UserData = {
      uid: fbUid,
      userId: finalUserId,
      email: auth.currentUser?.email ?? null,
      phone: auth.currentUser?.phoneNumber?.slice(3) ?? null,
      displayName: auth.currentUser?.displayName ?? "",
      photoUrl: auth.currentUser?.photoURL ?? "",
    };

    const result = await createUserIfNotExists(safeUser);
    if (result?.newUser) {
      if (process.env.NODE_ENV === "development") {
        console.log("Created new user document for uid:", fbUid);
      }
    } else {
    }
  }, []);

  const startListenerIfNeeded = useCallback(
    async (uid: string) => {
      if (unsubRef.current && uidRef.current === uid) return;

      stopListener();
      uidRef.current = uid;

      setLoading(true);

      // Ensure doc exists (do not block auth init globally anymore; only when profile is needed)
      try {
        await ensureUserDoc(uid);
      } catch (e) {
        console.error("ensureUserDoc failed", e);
      }

      const userDocRef = doc(firestore, "users", uid);
      unsubRef.current = onSnapshot(
        userDocRef,
        (snap) => {
          setUser(snap.exists() ? mapDbUserToClientUser(snap.data()) : null);
          setLoading(false);
        },
        (err) => {
          console.error("User profile listener error:", err);
          setLoading(false);
        },
      );
    },
    [ensureUserDoc, stopListener],
  );

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((fbUser) => {
      if (!fbUser) {
        stopListener();
        setUser(null);
        countRef.current = 0;
        return;
      }

      if (countRef.current > 0) {
        // someone requested profile already
        startListenerIfNeeded(fbUser.uid);
      }
    });

    return () => {
      unsubAuth();
      stopListener();
    };
  }, [startListenerIfNeeded, stopListener]);

  const requireProfile = useCallback(() => {
    countRef.current += 1;

    const u = auth.currentUser;
    if (u) startListenerIfNeeded(u.uid);
    else setLoading(true);

    return () => {
      countRef.current = Math.max(0, countRef.current - 1);
      if (countRef.current === 0) stopListener();
    };
  }, [startListenerIfNeeded, stopListener]);

  const refreshUser = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return null;

    setLoading(true);
    try {
      const ref = doc(firestore, "users", u.uid);
      const snap = await getDoc(ref);
      const next = snap.exists() ? mapDbUserToClientUser(snap.data()) : null;
      setUser(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  const stateValue = useMemo<UserProfileState>(
    () => ({
      clientUserLoading: loading,
      clientUser: user,
      subscribed: countRef.current > 0,
    }),
    [loading, user],
  );

  const actionsValue = useMemo<UserProfileActions>(
    () => ({
      requireProfile,
      refreshUser,
      setUser,
    }),
    [requireProfile, refreshUser],
  );

  return (
    <StateCtx.Provider value={stateValue}>
      <ActionsCtx.Provider value={actionsValue}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useUserProfileState() {
  const v = useContext(StateCtx);
  if (!v)
    throw new Error(
      "useUserProfileState must be used within UserProfileManagerProvider",
    );
  return v;
}

export function useUserProfileActions() {
  const v = useContext(ActionsCtx);
  if (!v)
    throw new Error(
      "useUserProfileActions must be used within UserProfileManagerProvider",
    );
  return v;
}

export function useUserProfile() {
  return { ...useUserProfileState(), ...useUserProfileActions() };
}
