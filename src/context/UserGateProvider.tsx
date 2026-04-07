"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth, firestore } from "@/firebase/client";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { AccountStatus, UserGate, UserRole } from "@/types/userGate";

type UserGateState = {
  gateLoading: boolean;
  gateSyncing: boolean;
  gate: UserGate | null;
  profileComplete: boolean | null;
  accountStatus: AccountStatus | null;
  rejectionReason: string | null;
  userRole: UserRole | null;
};

const Ctx = createContext<UserGateState | null>(null);

export function UserGateProvider({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<UserGate | null>(null);
  const [gateLoading, setGateLoading] = useState(true);
  const [gateSyncing, setGateSyncing] = useState(false);

  // prevent repeated creates if snapshot fires multiple times while doc missing
  const ensuredUidRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubGate: undefined | (() => void);

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubGate) {
        unsubGate();
        unsubGate = undefined;
      }

      ensuredUidRef.current = null;

      if (!user) {
        setGate(null);
        setGateLoading(false);
        setGateSyncing(false);
        return;
      }

      setGateLoading(true);

      const ref = doc(firestore, "userGate", user.uid);

      unsubGate = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        async (snap) => {
          setGateSyncing(snap.metadata.fromCache);

          if (!snap.exists()) {
            setGate(null);
            setGateLoading(false);

            // Create defaults once (safe values only)
            if (ensuredUidRef.current !== user.uid) {
              ensuredUidRef.current = user.uid;
              try {
                // Check admin claim from the current token to set correct defaults
                const tokenResult = await user.getIdTokenResult(false);
                const isAdmin = tokenResult.claims.admin === true;

                await setDoc(
                  ref,
                  isAdmin
                    ? {
                        profileComplete: true,
                        accountStatus: "approved",
                        rejectionReason: "",
                        userRole: "admin",
                        updatedAt: serverTimestamp(),
                      }
                    : {
                        profileComplete: false,
                        accountStatus: "pending",
                        rejectionReason: "",
                        userRole: "customer",
                        updatedAt: serverTimestamp(),
                      },
                  { merge: true },
                );
              } catch (e) {
                // If rules disallow create, you'll see it here.
                console.error("Failed to create gate doc:", e);
              }
            }
            return;
          }

          const d = snap.data();

          setGate({
            profileComplete: !!d.profileComplete,
            accountStatus: (d.accountStatus ?? "pending") as AccountStatus,
            rejectionReason: d.rejectionReason ?? "",
            userRole: (d.userRole as UserRole) || "customer",
          });

          setGateLoading(false);
        },
        (err) => {
          console.error("Gate listener error:", err);
          setGateLoading(false);
          setGateSyncing(false);
        },
      );
    });

    return () => {
      if (unsubGate) unsubGate();
      unsubAuth();
    };
  }, []);

  const value = useMemo<UserGateState>(() => {
    const exists = gate !== null;

    return {
      gateLoading,
      gateSyncing,
      gate,
      gateExists: exists,
      profileComplete: gate ? gate.profileComplete : gateLoading ? null : false,
      accountStatus: gate ? gate.accountStatus : gateLoading ? null : "pending",
      rejectionReason: gate ? (gate.rejectionReason ?? "") : null,
      userRole: gate ? gate.userRole : null,
    };
  }, [gateLoading, gateSyncing, gate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserGate() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUserGate must be used within UserGateProvider");
  return v;
}
