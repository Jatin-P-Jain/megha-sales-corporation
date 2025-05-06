"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/firebase/client";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        setLoading(true);
        try {
          e.preventDefault();
          const res = await fetch("/api/user/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const { exists } = await res.json();

          if (exists) {
            await sendPasswordResetEmail(auth, email);
            toast.success("Email sent successfully", {
              description:
                "A password reset link has been sent.Please check your inbox.",
            });
          } else {
            toast.error("Email not found", {
              description:
                "The email address you entered is not associated with any account.",
            });
          }
        } catch (e) {
          console.log({ e });
        }
        setEmail("");
        setLoading(false);
      }}
    >
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Email"
        className="border border-gray-300 rounded p-2 mb-4 w-full"
        disabled={loading}
      />
      <Button className="rounded p-2 w-full" type="submit" disabled={loading}>
        Send Reset Link
      </Button>
    </form>
  );
}
