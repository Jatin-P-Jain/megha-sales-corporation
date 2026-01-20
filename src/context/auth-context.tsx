// "use client";

// import {
//   loginWithEmailAndPass,
//   loginWithGoogle,
//   logoutUser,
//   sendOTP,
//   verifyOTP,
// } from "./firebase-auth";
// import { auth, firestore } from "@/firebase/client";
// import { removeToken } from "./actions";
// import {
//   ConfirmationResult,
//   RecaptchaVerifier,
//   User,
//   ParsedToken,
// } from "firebase/auth";
// import { createContext, useEffect, useState } from "react";
// import { createUserIfNotExists } from "@/lib/firebase/createUserIfNotExists";
// import { UserData } from "@/types/user";

// import { doc, getDoc } from "firebase/firestore";
// import { mapDbUserToClientUser } from "@/lib/firebase/mapDBUserToClient";

// type AuthContextType = {
//   loading: boolean;
//   clientUser: UserData | null;
//   refreshClientUser: () => Promise<void>;
//   clientUserLoading: boolean;
//   isLoggingOut: boolean;
//   currentUser: User | null;
//   customClaims: ParsedToken | null;
//   logout: () => Promise<void>;
//   loginWithGoogle: () => Promise<User | undefined>;
//   loginWithEmailAndPassword: (data: {
//     email: string;
//     password: string;
//   }) => Promise<User | undefined>;
//   handleSendOTP: (
//     mobile: string,
//     appVerifier: RecaptchaVerifier,
//   ) => Promise<ConfirmationResult>;
//   verifyOTP: (
//     otp: string,
//     confirmationResult: ConfirmationResult,
//   ) => Promise<User | undefined>;
// };

// export const AuthContext = createContext<AuthContextType | null>(null);

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [clientUser, setClientUser] = useState<UserData | null>(null);
//   const [clientUserLoading, setClientUserLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const refreshClientUser = async () => {
//     console.log({ currentUser });

//     if (!currentUser) return;
//     try {
//       const snap = await getDoc(doc(firestore, "users", currentUser.uid));
//       if (snap.exists()) {
//         setClientUser(mapDbUserToClientUser(snap.data()));
//       }
//     } catch (e) {
//       console.error("refreshClientUser failed", e);
//     } finally {
//       setClientUserLoading(false);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       setCurrentUser(user ?? null);
//       setLoading(false);
//       if (user) {
//         const result = await user.getIdTokenResult();
//         const firebaseAuth = result.claims.firebase
//           ? {
//               identities: result.claims.firebase.identities ?? {},
//               sign_in_provider: result.claims.firebase.sign_in_provider ?? "",
//             }
//           : undefined;
//         const safeUser: UserData = {
//           uid: user.uid,
//           email: user.email ?? null,
//           phone: user.phoneNumber?.slice(3) ?? null,
//           displayName: user.displayName ?? null,
//           role: result?.claims?.admin ? "admin" : null,
//           photoUrl: user.photoURL,
//           gstNumber: "",
//           firebaseAuth,
//         };

//         await createUserIfNotExists(safeUser);
//         setCustomClaims(result.claims ?? null);
//         try {
//           const snap = await getDoc(doc(firestore, "users", safeUser.uid));
//           if (snap.exists()) {
//             setClientUser(mapDbUserToClientUser(snap.data()));
//           }
//         } catch (e) {
//           console.error("refreshClientUser failed", e);
//         } finally {
//           setClientUserLoading(false);
//         }
//       } else {
//         await removeToken();
//         setClientUser(null);
//         setClientUserLoading(false);
//       }
//     });
//     return unsubscribe;
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         loading,
//         clientUser,
//         clientUserLoading,
//         refreshClientUser,
//         isLoggingOut,
//         currentUser,
//         customClaims,
//         logout: async () => {
//           setIsLoggingOut(true);
//           try {
//             await logoutUser();
//           } catch (err) {
//             console.error("Logout failed", err);
//             setIsLoggingOut(false);
//           }
//         },
//         loginWithGoogle,
//         loginWithEmailAndPassword: ({ email, password }) =>
//           loginWithEmailAndPass(email, password),
//         handleSendOTP: (mobile, appVerifier) => sendOTP(mobile, appVerifier),
//         verifyOTP: (otp, confirmationResult) =>
//           verifyOTP(otp, confirmationResult),
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };
