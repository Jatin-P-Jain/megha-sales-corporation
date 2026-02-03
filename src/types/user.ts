import { BusinessProfile } from "@/data/businessProfile";

export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type AccountStatus = "pending" | "approved" | "rejected";

export type UserRole =
  | "admin"
  | "retailer"
  | "wholesaler"
  | "distributor"
  | "other";

export type UserData = {
  uid: string;
  role: UserRole | string | null;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  gstNumber?: string;
  photoUrl?: string | null;
  businessProfile?: BusinessProfile | null;
  profileComplete?: boolean;
  accountStatus?: AccountStatus;
  rejectionReason?: string | null;
  firebaseAuth?: FirebaseAuthData;
};
