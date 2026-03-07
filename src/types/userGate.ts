import { UserRole } from "@/context/UserGateProvider";

export type UserGateDoc = {
  profileComplete: boolean;
  userRole: UserRole;
  accountStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended"
    | "deactivated";
  rejectionReason?: string;
};
