import { UserGate } from "./userGate";

export interface FirebaseAuthData {
  identities: Record<string, string>;
  sign_in_provider: string;
}

export type GstDetailsData = {
  flag: boolean;
  message: string;
  data: {
    ntcrbs: string;
    adhrVFlag: string;
    lgnm: string; // Legal Name (JAYWANTI JAIN)
    stj: string; // State Jurisdiction
    dty: string; // Type (Regular)
    cxdt: string;
    gstin: string; // GSTIN (22AEQPJ8017G1ZJ)
    nba: string[]; // Nature of Business array
    ekycVFlag: string;
    cmpRt: string;
    rgdt: string; // Registration Date
    ctb: string; // Constitution Type (Proprietorship)
    pradr: {
      adr: string; // Full Address string
      addr: {
        flno: string;
        lg: string;
        loc: string;
        pncd: string; // Pincode
        bnm: string;
        city: string;
        lt: string;
        stcd: string;
        bno: string;
        dst: string;
        st: string;
      };
    };
    sts: string; // Status (Active)
    tradeNam: string; // Trade Name (MEGHA SALES CARPORATION)
    isFieldVisitConducted: string;
    adhrVdt: string; // Aadhaar Verification Date
    ctj: string; // Central Jurisdiction
    einvoiceStatus: string;
    lstupdt: string;
    adadr: string[];
    ctjCd: string;
    errorMsg: string | null;
    stjCd: string;
  };
};

export type BusinessProfile = {
  gstin: string;
  legalName: string;
  tradeName: string;
  address: string;
  status: string;
  registrationDate: string;
  natureOfBusiness: string[];
  verifiedAt: string; // Add timestamp
  verifiedData?: GstDetailsData; // Optional: complete raw data
};

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

export type FeedbackUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};
