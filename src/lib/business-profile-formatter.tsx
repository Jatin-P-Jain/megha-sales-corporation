import type { UserData } from "@/types/user";

export const formatBusinessProfile = (user?: UserData | null): string => {
  if (!user) return "❌ No business details available.";

  const businessProfile = user.businessProfile as
    | {
        gstin?: string;
        legalName?: string;
        tradeName?: string;
        address?: string;
        status?: string;
        registrationDate?: string;
        natureOfBusiness?: string[];
        verifiedAt?: string;
      }
    | null
    | undefined;

  // ✅ 1) GST profile present
  if (businessProfile) {
    return `✅ Verified GST Profile`;
  }

  // ✅ 2) No GST profile → show PAN details (friendly)
  // Adjust these field names to match your actual UserData schema
  const panNumber = user.panNumber as string | undefined;

  if (panNumber) {
    return `ℹ️ PAN Details - ${panNumber}`.trim();
  }

  // ✅ 3) Nothing present
  return "❌ No GST or PAN details provided yet.";
};
