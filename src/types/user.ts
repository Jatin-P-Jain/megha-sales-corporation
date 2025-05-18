export type UserData = {
  uid: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  authProviders: string[];
  firmName?: string;
  photo?: string | null;
  profileComplete?: boolean;
};
