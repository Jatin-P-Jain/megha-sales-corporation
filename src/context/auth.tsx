"use client";

import { auth } from "@/firebase/client";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  ParsedToken,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { removeToken, setToken } from "./actions";
import { useRecaptcha } from "@/hooks/useRecaptcha";

type AuthContextType = {
  currentUser: User | null;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailAndPassword: (data: {
    email: string;
    password: string;
  }) => Promise<UserCredential>;
  handleSendOTP: (
    data: {
      mobile: string;
    },
    appVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult | undefined>;
  verifyOTP: (
    data: { otp: string },
    confirmationResult: ConfirmationResult
  ) => Promise<void>;
  customClaims: ParsedToken | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user ?? null);
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        const token = tokenResult.token;
        const refreshToken = user.refreshToken;
        const claims = tokenResult.claims;
        setCustomClaims(claims ?? null);
        if (token && refreshToken) {
          setToken(token, refreshToken);
        }
      } else {
        await removeToken();
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
    }
    window.location.reload();
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  };

  const loginWithEmailAndPassword = async (data: {
    email: string;
    password: string;
  }) => {
    return await signInWithEmailAndPassword(auth, data.email, data.password);
  };

  const handleSendOTP = async (
    data: { mobile: string },
    appVerifier: RecaptchaVerifier
  ) => {
    const confirmation = await signInWithPhoneNumber(
      auth,
      "+91" + data.mobile,
      appVerifier
    );
    return confirmation;
  };

  const verifyOTP = async (
    data: { otp: string; name?: string },
    confirmationResult: ConfirmationResult
  ) => {
    const result = await confirmationResult.confirm(data.otp);
    const user = result.user;
    await updateProfile(user, {
      displayName: data?.name, // ← whatever name you want
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        logout,
        loginWithGoogle,
        loginWithEmailAndPassword,
        handleSendOTP,
        verifyOTP,
        customClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
