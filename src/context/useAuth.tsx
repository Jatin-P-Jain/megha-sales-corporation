"use client";
import { useContext } from "react";

import {
  loginWithEmailAndPass,
  loginWithGoogle,
  logoutUser,
  sendOTP,
  verifyOTP,
} from "./firebase-auth";
import { auth, firestore } from "@/firebase/client";
import { removeToken } from "./actions";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  ParsedToken,
} from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";
import { UserData } from "@/types/user";

import { doc, getDoc } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { getFcmToken } from "@/firebase/firebase-messaging";
import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/firebase/saveFcmToken";

type AuthContextType = {
  loading: boolean;
  clientUser: UserData | null;
  refreshClientUser: () => Promise<void>;
  clientUserLoading: boolean;
  isLoggingOut: boolean;
  currentUser: User | null;
  customClaims: ParsedToken | null;
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
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [clientUser, setClientUser] = useState<UserData | null>(null);
  const [clientUserLoading, setClientUserLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
  const [inactivityLimit, setInactivityLimit] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshClientUser = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(firestore, "users", currentUser.uid));
      if (snap.exists()) {
        setClientUser(mapDbUserToClientUser(snap.data()));
      }
    } catch (e) {
      console.error("refreshClientUser failed", e);
    } finally {
      setClientUserLoading(false);
    }
  };

  useEffect(() => {
    const setupFcm = async () => {
      if (!currentUser) return;

      try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
        const token = await getFcmToken(vapidKey);

        if (token) {
          const metadata = getDeviceMetadata();
          await saveFcmToken(currentUser.uid, token, metadata);
          console.log("✅ FCM Token saved:", token);
        }
      } catch (err) {
        console.error("❌ FCM token error:", err);
      }
    };

    setupFcm();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        await removeToken();
        setClientUser(null);
        setClientUserLoading(false);
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      setCurrentUser(user ?? null);
      setLoading(false);
      const result = await user.getIdTokenResult(true);
      const firebaseAuth = result.claims.firebase
        ? {
            identities: result.claims.firebase.identities ?? {},
            sign_in_provider: result.claims.firebase.sign_in_provider ?? "",
          }
        : undefined;
      const safeUser: UserData = {
        uid: user.uid,
        email: user.email ?? null,
        phone: user.phoneNumber?.slice(3) ?? null,
        displayName: user.displayName ?? null,
        role: result?.claims?.admin ? "admin" : null,
        photoUrl: user.photoURL,
        firmName: "",
        firebaseAuth,
      };

      await createUserIfNotExists(safeUser);
      setCustomClaims(result.claims ?? null);
      let inactivityTimeLimit: number | undefined;
      if (result.claims?.admin) {
        inactivityTimeLimit = parseInt(
          process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0",
        );
      } else {
        inactivityTimeLimit = parseInt(
          process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0",
        );
      }
      setInactivityLimit(inactivityTimeLimit);
      try {
        const snap = await getDoc(doc(firestore, "users", safeUser.uid));
        if (snap.exists()) {
          setClientUser(mapDbUserToClientUser(snap.data()));
        }
      } catch (e) {
        console.error("refreshClientUser failed", e);
        await logoutUser();
        await removeToken();
        setCurrentUser(null);
        setClientUser(null);
      } finally {
        setClientUserLoading(false);
      }
    });
    return unsubscribe;
  }, []);
  useMonitorInactivity(currentUser, inactivityLimit);

  return (
    <AuthContext.Provider
      value={{
        loading,
        clientUser,
        clientUserLoading,
        refreshClientUser,
        isLoggingOut,
        currentUser,
        customClaims,
        logout: async () => {
          setIsLoggingOut(true);
          try {
            await logoutUser();
          } catch (err) {
            console.error("Logout failed", err);
            setIsLoggingOut(false);
          }
        },
        loginWithGoogle,
        loginWithEmailAndPassword: ({ email, password }) =>
          loginWithEmailAndPass(email, password),
        handleSendOTP: (mobile, appVerifier) => sendOTP(mobile, appVerifier),
        verifyOTP: (otp, confirmationResult) =>
          verifyOTP(otp, confirmationResult),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
