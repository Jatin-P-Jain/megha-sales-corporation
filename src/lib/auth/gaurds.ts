import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, fireStore } from "@/firebase/server";
import { UserRole } from "@/types/userGate";
export {
  getUserRoleFromClaims,
  hasAnyAllowedRole,
  isFullAdminClaim,
} from "@/lib/auth/claims";
import { hasAnyAllowedRole } from "@/lib/auth/claims";

export async function getVerifiedTokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  if (!token) redirect("/login");

  // Admin SDK verifies signature + returns uid + custom claims (e.g. admin)
  return auth.verifyIdToken(token);
}

export async function requireProfileCompleteOrRedirect(redirectTo: string) {
  const decoded = await getVerifiedTokenOrRedirect();

  const snap = await fireStore.collection("userGate").doc(decoded.uid).get();
  const user = snap.exists ? snap.data() : null;
  if (user?.profileComplete === false) {
    redirect(`/account/profile?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return decoded;
}

export async function requireAllowedRolesOrRedirect(
  allowedRoles: UserRole[],
  redirectPath = "/"
) {
  const decoded = await getVerifiedTokenOrRedirect();
  if (!hasAnyAllowedRole(decoded, allowedRoles)) {
    redirect(redirectPath);
  }
  return decoded;
}
