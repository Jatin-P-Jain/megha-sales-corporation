"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  loginWithEmailAndPass,
  loginWithGoogle,
  logoutUser,
  sendOTP,
  verifyOTP,
} from "./firebase-auth";
import { auth, firestore } from "@/firebase/client";
import { removeToken } from "./actions";
import { ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";
import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";
import { UserData } from "@/types/user";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";
import useMonitorInactivity from "@/hooks/useMonitorInactivity";
import { getDeviceMetadata } from "@/lib/utils";
import { saveFcmToken } from "@/firebase/saveFcmToken";
import { getMessaging, getToken } from "firebase/messaging";
import { toast } from "sonner";

type AuthContextType = {
  loading: boolean;
  clientUser: UserData | null;
  setClientUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  refreshClientUser: () => Promise<void>;
  clientUserLoading: boolean;
  isLoggingOut: boolean;
  currentUser: User | null;
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
  const [inactivityLimit, setInactivityLimit] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Track previous account status for comparison
  const previousAccountStatusRef = useRef<string | undefined>(undefined);

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

  // Refresh & save FCM token only when user is logged in
  const refreshAndSaveFcmToken = async () => {
    if (!currentUser) {
      console.log("No authenticated user; skipping FCM token save");
      return;
    }
    try {
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
      const token = await getToken(messaging, { vapidKey });
      if (!token) {
        console.log("No FCM token available");
        return;
      }
      const metadata = getDeviceMetadata();
      await saveFcmToken(currentUser.uid, token, metadata);
      console.log("✅ FCM token refreshed & saved:", token);
    } catch (error) {
      console.error("Failed to refresh and save FCM token", error);
    }
  };

  // Trigger token refresh/save on login state changes
  useEffect(() => {
    refreshAndSaveFcmToken();
  }, [currentUser]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        await removeToken();
        setClientUser(null);
        setClientUserLoading(false);
        setCurrentUser(null);
        setLoading(false);
        previousAccountStatusRef.current = undefined;
        return;
      }
      setCurrentUser(user);
      setLoading(false);

      // Persist user in Firestore and fetch claims
      const result = await user.getIdTokenResult(false);
      const safeUser: UserData = {
        uid: user.uid,
        email: user.email ?? null,
        phone: user.phoneNumber?.slice(3) ?? null,
        displayName: user.displayName ?? null,
        userType: result.claims.admin ? "admin" : null,
        photoUrl: user.photoURL,
        gstNumber: "",
        firebaseAuth: result.claims.firebase
          ? {
              identities: result.claims.firebase.identities ?? {},
              sign_in_provider: result.claims.firebase.sign_in_provider ?? "",
            }
          : undefined,
      };
      await createUserIfNotExists(safeUser);

      // Set inactivity limit based on user type
      const limit = result.claims.admin
        ? parseInt(process.env.NEXT_PUBLIC_ADMIN_INACTIVITY_LIMIT || "0")
        : parseInt(process.env.NEXT_PUBLIC_USER_INACTIVITY_LIMIT || "0");
      setInactivityLimit(limit);

      // ✅ SET UP REAL-TIME LISTENER for user document
      const userDocRef = doc(firestore, "users", safeUser.uid);

      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = mapDbUserToClientUser(docSnapshot.data());

            // Check if account status changed
            const currentStatus = userData.accountStatus;
            const previousStatus = previousAccountStatusRef.current;

            // Show notification only if status actually changed (not on initial load)
            if (
              previousStatus !== undefined &&
              currentStatus !== previousStatus
            ) {
              if (currentStatus === "approved") {
                toast.success("Account Approved! 🎉", {
                  description:
                    "Your account has been approved. You can now see all product discounts!",
                  duration: 5000,
                });
              } else if (currentStatus === "rejected") {
                toast.error("Account Rejected", {
                  description:
                    userData.rejectionReason ||
                    "Please contact support for more information.",
                  duration: 5000,
                });
              } else if (currentStatus === "pending") {
                toast.info("Account Status Updated", {
                  description:
                    "Your account status has been changed to pending.",
                  duration: 5000,
                });
              }
            }

            // Update previous status for next comparison
            previousAccountStatusRef.current = currentStatus;

            setClientUser(userData);
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

      // Return cleanup function for snapshot listener
      return () => {
        unsubscribeSnapshot();
      };
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useMonitorInactivity(currentUser, inactivityLimit);

  return (
    <AuthContext.Provider
      value={{
        loading,
        clientUser,
        setClientUser,
        clientUserLoading,
        refreshClientUser,
        isLoggingOut,
        currentUser,
        logout: async () => {
          setIsLoggingOut(true);
          try {
            await logoutUser();
            window.location.href = "/";
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
