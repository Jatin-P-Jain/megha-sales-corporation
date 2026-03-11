export type UserNotificationType = "order" | "enquiry" | "account" | "system";

export type UserNotificationStatus =
  | "created"
  | "updated"
  | "packing"
  | "dispatch"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated"
  | "pending"
  | "resolved"
  | "na";

export type UserNotification = {
  uid: string;
  type: UserNotificationType;
  title: string;
  body: string;
  url: string;
  clickAction: string;
  status: UserNotificationStatus;
  read: boolean;
  createdAt: string;
  readAt: string | null;
  source: "system" | "admin";
  metadata?: Record<string, string>;
};
