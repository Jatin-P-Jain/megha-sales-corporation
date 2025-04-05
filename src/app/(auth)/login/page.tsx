import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./login-form";

export default function Login() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-center text-2xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
