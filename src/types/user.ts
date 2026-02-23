import { BusinessProfile } from "@/data/businessProfile";

export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated";

export type BusinessType = "retailer" | "wholesaler" | "distributor" | "other";
export type UserType =
  | "admin"
  | "customer"
  | "accountant"
  | "dispatcher"
  | "other";

export type UserData = {
  uuid: string;
  userId: string;
  userType: UserType | string;
  businessType?: BusinessType | string;
  email: string | null;
  phone: string | null;
  displayName: string;
  businessIdType?: "pan" | "gst";
  gstNumber?: string;
  panNumber?: string;
  firmName?: string;
  photoUrl?: string;
  businessProfile?: BusinessProfile;
  profileComplete?: boolean;
  accountStatus?: AccountStatus;
  rejectionReason?: string;
  firebaseAuth?: FirebaseAuthData;
};
