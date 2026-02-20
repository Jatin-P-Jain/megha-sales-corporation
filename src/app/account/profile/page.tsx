import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./profile-form";
import { CircleUserRound } from "lucide-react";

export default async function Profile() {
  return (
    <Card className="gap-0">
      <CardHeader className="">
        <CardTitle className="flex flex-col items-center justify-center gap-4 text-xl md:text-2xl">
          <div className="flex items-center gap-2">
            <CircleUserRound className="size-8" /> Complete Your Profile
          </div>
          <span className="flex items-center justify-center gap-2 text-xs font-medium text-yellow-700">
            Please ensure your profile information is accurate and complete.
            This will help us provide you with the best experience and services.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ProfileForm />
      </CardContent>
    </Card>
  );
}
