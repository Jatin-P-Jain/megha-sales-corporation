import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  ConfirmationResult,
  User,
} from "firebase/auth";
import { collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, firestore } from "@/firebase/client";
import { removeToken, setToken } from "./actions";

export const loginWithGoogle = async (): Promise<User | undefined> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const token = await user.getIdToken(true);
  const { claimsUpdated } = await setToken(token, user.refreshToken);
  if (claimsUpdated) {
    // Claims were just set — force-refresh so the cookie gets the updated token
    const freshToken = await user.getIdToken(true);
    await setToken(freshToken, user.refreshToken);
  }
  return user;
};

export const loginWithEmailAndPass = async (
  email: string,
  password: string
): Promise<User | undefined> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const token = await user.getIdToken(true);
  const { claimsUpdated } = await setToken(token, user.refreshToken);
  if (claimsUpdated) {
    const freshToken = await user.getIdToken(true);
    await setToken(freshToken, user.refreshToken);
  }
  return user;
};

export const sendOTP = async (
  mobile: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    return await signInWithPhoneNumber(auth, `+91${mobile}`, verifier);
  } catch (e) {
    // Reset the widget so the user can retry; full verifier management is
    // handled by useRecaptcha / useMobileOtp (they call resetRecaptcha in finally).
    if (typeof window !== "undefined" && window.grecaptcha) {
      try {
        window.grecaptcha.reset(window.recaptchaWidgetId);
      } catch {
        // ignore — hook-level reset will cover this
      }
    }
    throw e;
  }
};

export const verifyOTP = async (
  otp: string,
  confirmationResult: ConfirmationResult
): Promise<User | undefined> => {
  try {
    const result = await confirmationResult.confirm(otp);
    if (result) {
      const user = result.user;
      const token = await user.getIdToken(true);
      const { claimsUpdated } = await setToken(token, user.refreshToken);
      if (claimsUpdated) {
        const freshToken = await user.getIdToken(true);
        await setToken(freshToken, user.refreshToken);
      }
      return user;
    } else {
      console.error("OTP verification failed: No result returned");
    }
  } catch (err) {
    console.error(
      "OTP verification failed:",
      err instanceof Error ? err.message : err
    );
    throw err;
  }
};

export const logoutUser = async () => {
  const currentUser = auth.currentUser;
  if (currentUser?.uid) {
    try {
      const tokenSnap = await getDocs(
        collection(firestore, "users", currentUser.uid, "fcmTokens")
      );
      await Promise.all(tokenSnap.docs.map((d) => deleteDoc(d.ref)));
    } catch {
      // Best-effort — don't block logout if token cleanup fails
    }
  }
  await auth.signOut();
  await removeToken();
};
