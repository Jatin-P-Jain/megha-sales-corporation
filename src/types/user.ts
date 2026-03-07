import { BusinessProfile } from "@/data/businessProfile";
import { UserGate } from "./userGate";

export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type BusinessType = "retailer" | "wholesaler" | "distributor" | "other";

export type UserData = {
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
};

export type FullUser = UserData & UserGate;
