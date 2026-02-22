import { UserData } from "./user";

export type Enquiry = {
  id: string;
  enquiryText: string;
  sentBy: UserData | { name: string; phone: string; email: string };
  status: "pending" | "in-progress" | "resolved";
  repliedText?: string;
  repliedBy?: UserData;
  repliedAt?: Date;
  created: Date;
  updated: Date;
};
