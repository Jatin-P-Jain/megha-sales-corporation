export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated";

export type UserRole = "admin" | "customer" | "dispatcher" | "accountant";

export type UserGate = {
  profileComplete: boolean;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  userRole: UserRole;
};

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
