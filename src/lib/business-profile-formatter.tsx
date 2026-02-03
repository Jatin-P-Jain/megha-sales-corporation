// lib/formatBusinessProfile.ts

import { BusinessProfile } from "@/data/businessProfile";

export const formatBusinessProfile = (
  businessProfile?: BusinessProfile | null,
): string => {
  if (!businessProfile) {
    return "❌ No business profile provided";
  }

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

  // Format registration date
  const formattedRegDate = registrationDate
    ? new Date(registrationDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  // Format verified date
  const formattedVerifiedDate = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  // Format nature of business
  const natureOfBusinessStr =
    natureOfBusiness && natureOfBusiness.length > 0
      ? natureOfBusiness.join(", ")
      : "N/A";

  return `✅ *Verified GST Profile*/n
• GSTIN: ${gstin || "N/A"}/n
• Legal Name: ${legalName || "N/A"}
• Trade Name: ${tradeName || "N/A"}
• Address: ${address || "N/A"}
• Registration Date: ${formattedRegDate}
• Status: ${status || "N/A"}
• Nature of Business: ${natureOfBusinessStr}
• Verified On: ${formattedVerifiedDate}`;
};
