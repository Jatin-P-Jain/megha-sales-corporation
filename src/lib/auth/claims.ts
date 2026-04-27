import { DecodedIdToken } from "firebase-admin/auth";
import { UserRole } from "@/types/userGate";

const ALL_ROLES: UserRole[] = [
  "admin",
  "customer",
  "dispatcher",
  "accountant",
  "sales",
];

export function getUserRoleFromClaims(
  decoded: Partial<DecodedIdToken>
): UserRole {
  const claimRole = decoded.userRole;
  if (
    typeof claimRole === "string" &&
    ALL_ROLES.includes(claimRole as UserRole)
  ) {
    return claimRole as UserRole;
  }

  return decoded.admin ? "admin" : "customer";
}

export function hasAnyAllowedRole(
  decoded: Partial<DecodedIdToken>,
  allowedRoles: UserRole[]
): boolean {
  const role = getUserRoleFromClaims(decoded);
  return allowedRoles.includes(role);
}

export function isFullAdminClaim(decoded: Partial<DecodedIdToken>): boolean {
  if (!decoded.admin) return false;
  const role = decoded.userRole;
  return !role || role === "admin";
}
