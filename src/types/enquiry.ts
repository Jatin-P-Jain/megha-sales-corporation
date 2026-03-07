import { FullUser } from "./user";

export type Enquiry = {
  id: string;
  enquiryText: string;
  userId: string;
  sentBy:
    | FullUser
    | { displayName: string; phone: string; email: string; photoUrl?: string };
  status: "pending" | "in-progress" | "resolved";
  replies?: {
    text: string;
    repliedBy:
      | FullUser
      | {
          displayName: string;
          phone: string;
          email: string;
          photoUrl?: string;
        };
    repliedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};
