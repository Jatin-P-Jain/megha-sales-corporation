export type BusinessType = "retailer" | "wholesaler" | "distributor" | "other";
export type BusinessProfile = Record<string, unknown>;
export type FirebaseAuthData = Record<string, unknown>;
export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated";
export type UserRole = "admin" | "customer";

export interface UserData {
  uid: string;
  userId: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  businessType?: BusinessType | string;
  businessIdType?: "pan" | "gst";
  gstNumber?: string;
  panNumber?: string;
  firmName?: string;
  photoUrl?: string;
  businessProfile?: BusinessProfile;
  firebaseAuth?: FirebaseAuthData;
}

export interface UserGate {
  profileComplete: boolean;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  userRole: UserRole;
}

export interface UsersDirectory extends UserData, UserGate {}
