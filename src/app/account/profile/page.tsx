import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./profile-form";
import { Info } from "lucide-react";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { UserType } from "@/types/user";
import { getUserFromDB } from "@/data/users";

export default async function Profile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;

  const user = await getUserFromDB();

  let userType: UserType | string;

  if (verifiedToken?.admin) {
    userType = "admin";
  } else if (
    user?.userType === "retailer" ||
    user?.userType === "wholesaler" ||
    user?.userType === "distributor"
  ) {
    userType = user.userType;
  } else if (user?.userType && typeof user?.userType === "string") {
    userType = "other";
  } else {
    userType = ""; // or a sensible fallback default
  }

  const mergedUser = {
    email: user?.email ?? verifiedToken?.email ?? "",
    displayName: user?.displayName ?? verifiedToken?.name ?? "",
    phone:
      user?.phone ??
      (verifiedToken?.phone_number?.startsWith("+91")
        ? verifiedToken.phone_number.slice(3)
        : ""),
    userType,
    gstNumber: user?.gstNumber ?? "",
    photoUrl: user?.photoUrl ?? verifiedToken?.picture ?? "",
    businessType: user?.businessType ?? "",
    businessIdType: user?.panNumber ? "pan" : "gst",
    panNumber: user?.panNumber ?? "",
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
            userType: mergedUser.userType,
            businessIdType: mergedUser.businessIdType === "pan" ? "pan" : "gst",
            panNumber: mergedUser.panNumber,
            businessType: mergedUser.businessType ?? "",
            gstNumber: mergedUser.gstNumber,
            photoUrl: mergedUser.photoUrl,
          }}
          verifiedToken={verifiedToken}
        />
      </CardContent>
    </Card>
  );
}
