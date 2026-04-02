import { FullUser } from "./user";

export type EnquiryStatus = "pending" | "in-progress" | "resolved";

export type Enquiry = {
  id: string;
  userId: string;
  createdBy:
    | FullUser
    | { displayName: string; phone: string; email: string; photoUrl?: string };
  status: EnquiryStatus;
  conversation?: {
    text: string;
    messageBy:
      | FullUser
      | {
          displayName: string;
          phone: string;
          email: string;
          photoUrl?: string;
        };
    sentAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};
