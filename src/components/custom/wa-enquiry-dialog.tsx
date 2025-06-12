"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { SendIcon } from "lucide-react";
import { useAuth } from "@/context/useAuth";

type EnquiryDialogProps = {
  trigger: React.ReactNode;
};

export function EnquiryDialog({ trigger }: EnquiryDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const auth = useAuth();
  const handleSendClick = async () => {
    setIsSending(true);
    await fetch("/api/wa-send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: auth.clientUser?.displayName,
        customerPhone: auth.clientUser?.phone,
      }),
    });
    setIsSending(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="p-4 md:p-8">
        <DialogHeader>
          <DialogTitle>Contact & Enquiry</DialogTitle>
        </DialogHeader>

        <Card className="p-4 shadow-none">
          <CardContent className="space-y-4 p-0">
            <p className="text-muted-foreground text-center text-xs md:text-sm">
              Please reach out with any queries or feedback. We will get back to
              you as soon as possible.
            </p>

            <form className="space-y-4" onSubmit={handleSendClick}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Your Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={auth.clientUser?.displayName ?? ""}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Your Phone Number
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={auth.clientUser?.phone ?? ""}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Your Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={auth.clientUser?.email ?? ""}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={8}
                  required
                  className=""
                />
              </div>
              <Button type="submit" className="w-full">
                <SendIcon className="size-4" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
