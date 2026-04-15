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

import type {
  ConfirmationResult,
  RecaptchaVerifier,
  User,
} from "firebase/auth";

import { auth } from "@/firebase/client";

import {
  loginWithEmailAndPass,
  loginWithGoogle as loginWithGoogleFn,
  logoutUser,
  sendOTP,
  verifyOTP as verifyOTPFn,
} from "./firebase-auth";

import { removeToken, setToken } from "./actions";

export type AuthState = {
  authLoading: boolean;
  currentUser: User | null;
  isLoggingOut: boolean;
  isAdmin: boolean;
  userRole?: string;
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
};

const AuthStateContext = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActions | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const refreshInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const MIN_REFRESH_GAP_MS = 30_000;

  const syncAuthStateFromToken = useCallback(async (user: User) => {
    const tokenResult = await user.getIdTokenResult(false);
    setIsAdmin(!!tokenResult.claims.admin);
    setUserRole((tokenResult.claims.userRole as string) ?? "customer");
  }, []);

  const refreshClaimsAndSession = useCallback(
    async (user: User, force = false) => {
      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < MIN_REFRESH_GAP_MS) {
        return;
      }

      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;

      try {
        const refreshedToken = await user.getIdToken(true);
        await setToken(refreshedToken, user.refreshToken);
        await syncAuthStateFromToken(user);
        lastRefreshAtRef.current = Date.now();
      } catch (e) {
        console.error("Failed to refresh auth claims/session", e);
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [syncAuthStateFromToken],
  );

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
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        await removeToken();
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      setCurrentUser(user);
      try {
        await refreshClaimsAndSession(user, true);
      } catch (e) {
        console.error("getIdTokenResult failed", e);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [refreshClaimsAndSession]);

  useEffect(() => {
    if (!currentUser) return;

    const refreshIfNeeded = () => {
      void refreshClaimsAndSession(currentUser, false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    };

    window.addEventListener("focus", refreshIfNeeded);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshIfNeeded);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, refreshClaimsAndSession]);

  const stateValue = useMemo<AuthState>(
    () => ({
      authLoading,
      currentUser,
      isLoggingOut,
      isAdmin,
      userRole,
    }),
    [authLoading, currentUser, isLoggingOut, isAdmin, userRole],
  );

  const actionsValue = useMemo<AuthActions>(
    () => ({
      logout,
      loginWithGoogle,
      loginWithEmailAndPassword,
      handleSendOTP,
      verifyOTP,
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
