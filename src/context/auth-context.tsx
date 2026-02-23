"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { auth, firestore } from "@/firebase/client";

import {
  loginWithEmailAndPass,
  loginWithGoogle as loginWithGoogleFn,
  logoutUser,
  sendOTP,
  verifyOTP as verifyOTPFn,
} from "./firebase-auth";

import { removeToken } from "./actions";

import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import { generateSequenceId } from "@/lib/firebase/generateSequenceId";
import type { UserData } from "@/types/user";

export type AuthState = {
  loading: boolean;
  currentUser: User | null;

  clientUserLoading: boolean;
  clientUser: UserData | null;

  isLoggingOut: boolean;
};

export type AuthActions = {
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User | undefined>;
  loginWithEmailAndPassword: (data: {
    email: string;
    password: string;
  }) => Promise<User | undefined>;
  handleSendOTP: (
    mobile: string,
    appVerifier: RecaptchaVerifier,
  ) => Promise<ConfirmationResult>;
  verifyOTP: (
    otp: string,
    confirmationResult: ConfirmationResult,
  ) => Promise<User | undefined>;

  setClientUser: React.Dispatch<React.SetStateAction<UserData | null>>;
};

const AuthStateContext = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActions | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [clientUser, setClientUser] = useState<UserData | null>(null);
  const [clientUserLoading, setClientUserLoading] = useState(true);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
      setIsLoggingOut(false);
    }
  }, []);

  const loginWithGoogle = useCallback(() => loginWithGoogleFn(), []);

  const loginWithEmailAndPassword = useCallback(
    ({ email, password }: { email: string; password: string }) =>
      loginWithEmailAndPass(email, password),
    [],
  );

  const handleSendOTP = useCallback(
    (mobile: string, appVerifier: RecaptchaVerifier) =>
      sendOTP(mobile, appVerifier),
    [],
  );

  const verifyOTP = useCallback(
    (otp: string, confirmationResult: ConfirmationResult) =>
      verifyOTPFn(otp, confirmationResult),
    [],
  );

  useEffect(() => {
    let unsubscribeSnapshot: undefined | (() => void);

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (!user) {
        await removeToken();
        setCurrentUser(null);
        setClientUser(null);
        setClientUserLoading(false);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      setLoading(false);
      setClientUserLoading(true);

      const tokenResult = await user.getIdTokenResult(false);

      // FIRST-TIME userId logic:
      // 1) Check if user doc exists and already has userId.
      // 2) Only generate sequence id if doc missing (or missing userId).
      const userDocRef = doc(firestore, "users", user.uid);
      const existingSnap = await getDoc(userDocRef);

      const existingData = existingSnap.exists() ? existingSnap.data() : null;
      const existingUserId =
        existingData && existingData.userId ? existingData.userId : null;

      const finalUserId = existingUserId ?? (await generateSequenceId("users"));

      const safeUser: UserData = {
        uuid: user.uid,
        userId: finalUserId,
        email: user.email ?? null,
        phone: user.phoneNumber?.slice(3) ?? null,
        displayName: user.displayName ?? null,
        userType: tokenResult.claims.admin ? "admin" : null,
        photoUrl: user.photoURL,
        firebaseAuth: tokenResult.claims.firebase
          ? {
              identities: tokenResult.claims.firebase.identities ?? {},
              sign_in_provider:
                tokenResult.claims.firebase.sign_in_provider ?? "",
            }
          : undefined,
      };

      await createUserIfNotExists(safeUser);

      // Realtime user doc for UI state
      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            setClientUser(mapDbUserToClientUser(snap.data()));
          } else {
            setClientUser(null);
          }
          setClientUserLoading(false);
        },
        (error) => {
          console.error("Error listening to user document:", error);
          setClientUserLoading(false);
        },
      );
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  const stateValue = useMemo<AuthState>(
    () => ({
      loading,
      currentUser,
      clientUserLoading,
      clientUser,
      isLoggingOut,
    }),
    [loading, currentUser, clientUserLoading, clientUser, isLoggingOut],
  );

  const actionsValue = useMemo<AuthActions>(
    () => ({
      logout,
      loginWithGoogle,
      loginWithEmailAndPassword,
      handleSendOTP,
      verifyOTP,
      setClientUser,
    }),
    [
      logout,
      loginWithGoogle,
      loginWithEmailAndPassword,
      handleSendOTP,
      verifyOTP,
    ],
  );

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error("useAuthState must be used within AuthProvider");
  return ctx;
}

export function useAuthActions() {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error("useAuthActions must be used within AuthProvider");
  return ctx;
}

export function useAuth() {
  return { ...useAuthState(), ...useAuthActions() };
}
