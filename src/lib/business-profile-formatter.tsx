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
    const {
      gstin,
      legalName,
      tradeName,
      address,
      status,
      registrationDate,
      natureOfBusiness,
      verifiedAt,
    } = businessProfile;

    const formattedRegDate = registrationDate
      ? new Date(registrationDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const formattedVerifiedDate = verifiedAt
      ? new Date(verifiedAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    const natureOfBusinessStr =
      natureOfBusiness && natureOfBusiness.length > 0
        ? natureOfBusiness.join(", ")
        : "N/A";

    return (
      `✅ Verified GST Profile\n` +
      `• GSTIN: ${gstin || "N/A"}\n` +
      `• Legal Name: ${legalName || "N/A"}\n` +
      `• Trade Name: ${tradeName || "N/A"}\n` +
      `• Address: ${address || "N/A"}\n` +
      `• Registration Date: ${formattedRegDate}\n` +
      `• Status: ${status || "N/A"}\n` +
      `• Nature of Business: ${natureOfBusinessStr}\n` +
      `• Verified On: ${formattedVerifiedDate}`
    );
  }

  // ✅ 2) No GST profile → show PAN details (friendly)
  // Adjust these field names to match your actual UserData schema
  const panNumber = user.panNumber as string | undefined;

  if (panNumber) {
    return (
      `ℹ️ PAN Details\n` +
      `• PAN: ${panNumber}\n` +
      `• Note: GST profile not provided yet.`
    ).trim();
  }

  // ✅ 3) Nothing present
  return "❌ No GST or PAN details provided yet.";
};
