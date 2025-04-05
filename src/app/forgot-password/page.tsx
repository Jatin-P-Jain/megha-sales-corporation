import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ForgotPasswordForm from "./forgot-password-form";

export default function ForgotPassword() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl mb-4">
          Forgot Password
        </CardTitle>
        <CardDescription>
          Please enter your email address below and we will send you a link to
          reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
