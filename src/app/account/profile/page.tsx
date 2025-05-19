import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./profile-form";
import { Info } from "lucide-react";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { UserRole } from "@/types/user";
import { getUserFromDB } from "@/data/user";

export default async function Profile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  console.log({ verifiedToken });

  const user = await getUserFromDB();

  console.log({ user });

  let role: UserRole;
  let otherUserRole: string | undefined = undefined;

  if (verifiedToken?.admin) {
    role = "admin";
  } else if (
    user?.role === "retailer" ||
    user?.role === "wholesaler" ||
    user?.role === "distributor"
  ) {
    role = user.role;
  } else if (user?.role && typeof user?.role === "string") {
    role = "other";
    otherUserRole = user.role;
  } else {
    role = "retailer"; // or a sensible fallback default
  }

  const mergedUser = {
    email: user?.email ?? verifiedToken?.email ?? "",
    displayName: user?.displayName ?? verifiedToken?.name ?? "",
    phone:
      user?.phone ??
      (verifiedToken?.phone_number?.startsWith("+91")
        ? verifiedToken.phone_number.slice(3)
        : ""),
    role,
    firmName: user?.firmName ?? "",
    otherUserRole,
    photoUrl: user?.photoUrl ?? verifiedToken?.picture ?? "",
  };
  return (
    <Card className="gap-0">
      <CardHeader className="">
        <CardTitle className="flex flex-col items-center justify-center gap-4 text-2xl">
          Your Profile
          <span className="flex items-center justify-center gap-2 text-xs font-medium text-yellow-800 md:text-sm">
            <Info className="size-6 text-yellow-800" />
            Almost there! Just a few more details to get you fully set up.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        <span className="text-muted-foreground text-xs">
          * marked fields are mandatory
        </span>
        <ProfileForm
          defaultValues={{
            email: mergedUser.email,
            displayName: mergedUser.displayName,
            phone: mergedUser.phone,
            role: mergedUser.role,
            firmName: mergedUser.firmName,
            otherUserRole: mergedUser.otherUserRole,
            photoUrl: mergedUser.photoUrl,
          }}
          verifiedToken={verifiedToken}
        />
      </CardContent>
    </Card>
  );
}
