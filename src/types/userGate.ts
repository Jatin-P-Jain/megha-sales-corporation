export type UserGateDoc = {
  profileComplete: boolean;
  userType: string; // "admin" | "customer" etc
  accountStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended"
    | "deactivated";
  rejectionReason?: string;
};
