// whatsappRecipients.ts
import { fireStore } from "@/firebase/server";

export type AdminRole = "owner" | "accountant" | "support" | "dispatcher";

export type AdminRecipient = {
  id: string;
  name: string;
  phoneE164: string; // e.g. "+9198xxxxxx"
  roles: AdminRole[];
};

// Static fallback list (used when no Firestore staff are configured)
export const ADMIN_RECIPIENTS: AdminRecipient[] = [
  {
    id: "jatin",
    name: "Jatin",
    phoneE164: "+919636245681",
    roles: ["owner", "support"],
  },
];

// Which templates go to which AdminRoles
export const TEMPLATE_ROLES: Record<
  | "account_approval_request_to_admin"
  | "account_approval_reminder_to_admin"
  | "order_placed_to_admin_v2"
  | "enquiry_received_to_admin_v2"
  | "feedback_received_to_admin",
  AdminRole[]
> = {
  account_approval_request_to_admin: ["owner", "support"],
  account_approval_reminder_to_admin: ["owner", "support"],
  order_placed_to_admin_v2: ["owner", "support", "dispatcher"],
  enquiry_received_to_admin_v2: ["owner", "support"],
  feedback_received_to_admin: ["owner", "support"],
};

// Maps the AdminRole filter → which Firestore userRoles should receive it
const ADMIN_ROLE_TO_USER_ROLE: Record<AdminRole, string[]> = {
  owner: ["admin"],
  support: ["admin"],
  dispatcher: ["dispatcher"],
  accountant: ["accountant"],
};

function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  // If the number starts with 0, replace with country code (India default)
  if (digits.startsWith("0")) return `+91${digits.slice(1)}`;
  // If already has country code (10+ digits without leading +)
  if (digits.length > 10) return `+${digits}`;
  // Assume India mobile
  return `+91${digits}`;
}

/**
 * Dynamically resolves recipients for a WhatsApp template by querying Firestore
 * for staff users (userRole in userGate collection) and looking up their phones.
 * Falls back to static ADMIN_RECIPIENTS if no Firestore staff are found.
 */
export async function recipientsForTemplate(
  templateKey: keyof typeof TEMPLATE_ROLES
): Promise<AdminRecipient[]> {
  const requiredAdminRoles = TEMPLATE_ROLES[templateKey];

  // Collect which userRoles should receive this template
  const neededUserRoles = Array.from(
    new Set(requiredAdminRoles.flatMap((r) => ADMIN_ROLE_TO_USER_ROLE[r]))
  );

  try {
    // Query userGate for staff members with relevant roles
    const snapshot = await fireStore
      .collection("userGate")
      .where("userRole", "in", neededUserRoles)
      .get();

    if (snapshot.empty) {
      // Fall back to static list
      return ADMIN_RECIPIENTS.filter((r) =>
        r.roles.some((role) => requiredAdminRoles.includes(role))
      );
    }

    // Fetch phone numbers from users collection for each matched uid
    const uids = snapshot.docs.map((d) => d.id);
    const userDocs = await Promise.all(
      uids.map((uid) => fireStore.collection("users").doc(uid).get())
    );

    const dynamic: AdminRecipient[] = userDocs
      .filter((d) => d.exists && d.data()?.phone)
      .map((d) => {
        const data = d.data()!;
        const userRole = snapshot.docs.find((g) => g.id === d.id)?.data()
          ?.userRole as string;
        const roles: AdminRole[] =
          userRole === "dispatcher"
            ? ["dispatcher"]
            : userRole === "accountant"
            ? ["accountant"]
            : ["owner", "support"];

        return {
          id: d.id,
          name: data.displayName || "Admin",
          phoneE164: formatPhoneE164(data.phone as string),
          roles,
        };
      });

    return dynamic.length > 0
      ? dynamic
      : ADMIN_RECIPIENTS.filter((r) =>
          r.roles.some((role) => requiredAdminRoles.includes(role))
        );
  } catch (err) {
    console.error(
      "[whatsappRecipients] Firestore lookup failed, using static fallback:",
      err
    );
    return ADMIN_RECIPIENTS.filter((r) =>
      r.roles.some((role) => requiredAdminRoles.includes(role))
    );
  }
}
