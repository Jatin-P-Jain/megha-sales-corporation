import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "./register-form";
import GoogleLoginButton from "@/components/custom/google-login-button";
import LoginLink from "@/components/custom/login-link";

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
          <div className="flex gap-2 justify-center items-center mt-4 text-xs md:text-sm">
            Already have an account? <LoginLink />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
