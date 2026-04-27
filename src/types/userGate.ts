export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

export type UserRole =
  | "admin"
  | "customer"
  | "dispatcher"
  | "accountant"
  | "sales";

export type UserGate = {
  profileComplete: boolean;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  userRole: UserRole;
};

export type UserGateDoc = {
  profileComplete: boolean;
  userRole: UserRole;
  accountStatus?: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
};
