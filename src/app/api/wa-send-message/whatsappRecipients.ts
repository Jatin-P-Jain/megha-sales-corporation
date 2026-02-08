// whatsappRecipients.ts
export type AdminRole = "owner" | "sales" | "support";

export type AdminRecipient = {
  id: string;
  name: string;
  phoneE164: string; // e.g. "+9198xxxxxx"
  roles: AdminRole[];
};

export const ADMIN_RECIPIENTS: AdminRecipient[] = [
  {
    id: "jatin",
    name: "Jatin",
    phoneE164: "+919636245681",
    roles: ["owner", "sales"],
  },
  {
    id: "support1",
    name: "Support",
    phoneE164: "+9198XXXXXXXX",
    roles: ["support"],
  },
];

// Which templates go to which roles
export const TEMPLATE_ROLES: Record<
  | "account_approval_request"
  | "admin_order_recieved_v1"
  | "customer_inquiry_recieved",
  AdminRole[]
> = {
  account_approval_request: ["owner"],
  admin_order_recieved_v1: ["owner", "sales"],
  customer_inquiry_recieved: ["support", "owner"],
};

export function recipientsForTemplate(
  templateKey: keyof typeof TEMPLATE_ROLES
) {
  const roles = TEMPLATE_ROLES[templateKey];
  return ADMIN_RECIPIENTS.filter((r) =>
    r.roles.some((role) => roles.includes(role))
  );
}
