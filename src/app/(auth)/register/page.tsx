import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "./register-form";
import GoogleLoginButton from "@/components/custom/google-login-button";
import Link from "next/link";

export default function Register() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-center text-2xl">
            Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <span className="w-full flex justify-center text-zinc-500 text-[14px] my-4">
            or
          </span>
          <GoogleLoginButton variant={"outline"} />
          <div className="flex gap-2 justify-center items-center mt-4 text-sm">
            Already have an account?{" "}
            <Link href={"/login"} className="text-cyan-900 underline">
              Login to your account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
