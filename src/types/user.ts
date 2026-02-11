import { BusinessProfile } from "@/data/businessProfile";

export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type AccountStatus = "pending" | "approved" | "rejected" | "suspended" | "deactivated";

export type BusinessType = "retailer" | "wholesaler" | "distributor" | "other";
export type UserType =
  | "admin"
  | "customer"
  | "accountant"
  | "dispatcher"
  | "other";

export type UserData = {
  uid: string;
  userType: UserType | string | null;
  businessType?: BusinessType | string | null;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  gstNumber?: string;
  panNumber?: string;
  photoUrl?: string | null;
  businessProfile?: BusinessProfile | null;
  profileComplete?: boolean;
  accountStatus?: AccountStatus;
  rejectionReason?: string | null;
  firebaseAuth?: FirebaseAuthData;
};
