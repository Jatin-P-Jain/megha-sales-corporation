import GoogleLoginButton from "@/components/custom/google-login-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleLoginButton />
      </CardContent>
    </Card>
  );
}
