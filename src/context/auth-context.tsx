"use client";

import {
  loginWithEmailAndPass,
  loginWithGoogle,
  logoutUser,
  sendOTP,
  verifyOTP,
} from "./firebase-auth";
import { auth } from "@/firebase/client";
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

type AuthContextType = {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user ?? null);
      if (user) {
        const result = await user.getIdTokenResult();
        const safeUser: UserData = {
          uid: user.uid,
          email: user.email ?? null,
          phone: user.phoneNumber ?? null,
          displayName: user.displayName ?? null,
          authProviders: user.providerData.map((p) => p.providerId),
          role: result?.claims?.admin ? "admin" : null,
          photo: user.photoURL,
          firmName: "",
        };

        await createUserIfNotExists(safeUser);
        setCustomClaims(result.claims ?? null);
      } else {
        await removeToken();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        customClaims,
        logout: logoutUser,
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
