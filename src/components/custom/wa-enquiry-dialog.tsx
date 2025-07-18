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
import React, { useEffect, useRef, useState } from "react";
import { Loader2Icon, SendIcon, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { toast } from "sonner";

type EnquiryDialogProps = {
  trigger: React.ReactNode;
};

export function EnquiryDialog({ trigger }: EnquiryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const auth = useAuth();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  const isLoggedIn = !!auth.clientUser;

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setName(auth.clientUser?.displayName ?? "");
      setPhone(auth.clientUser?.phone ?? "");
      setEmail(auth.clientUser?.email ?? "");
    } else if (!isLoggedIn) {
      setName("");
      setPhone("");
      setEmail("");
    }
    setMessage("");
    setIsSent(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isSent) return;
    if (isLoggedIn && messageRef.current) {
      messageRef.current.focus();
    } else if (!isLoggedIn && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen, isSent, isLoggedIn]);

  const handleSendClick = async () => {
    if (!message.trim()) {
      toast.error("Message is required.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "customer_enquiry_received",
          customerName: name,
          customerPhone: phone,
          customerMessage: message,
          customerWANumber: phone,
        }),
      });

      if (response.ok) {
        setIsSent(true);
        toast.success("Thanks for Reaching Out!", {
          description: "We've received your enquiry. You'll hear from us soon!",
        });
      } else {
        toast.error("Error sending the message.", {
          description: "We couldn't send your query. Please try again shortly.",
        });
      }
    } catch (err) {
      console.log(err);
      toast.error("Oops! Something Went Wrong", {
        description: "We couldn't send your query. Please try again shortly.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form if closed manually or after OK click
      setIsSent(false);
      setMessage("");
      if (!isLoggedIn) {
        setName("");
        setPhone("");
        setEmail("");
      }
    }
  };

  const handleOkClick = () => {
    setIsOpen(false); // Closes dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      </DialogTrigger>
      <DialogContent className="p-4 md:p-8">
        <DialogHeader>
          <DialogTitle>Contact & Enquiry</DialogTitle>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="size-10 text-green-600" />
            <p className="text-muted-foreground text-center text-sm">
              Your enquiry has been submitted successfully. Our team will
              contact you shortly.
            </p>
            <Button className={"w-1/2"} onClick={handleOkClick}>
              OK
            </Button>
          </div>
        ) : (
          <Card className="p-4 shadow-none">
            <CardContent className="space-y-4 p-0">
              <p className="text-muted-foreground text-center text-xs md:text-sm">
                Please reach out with any queries or feedback. We will get back
                to you as soon as possible.
              </p>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendClick();
                }}
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    ref={nameInputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={isLoggedIn}
                    className={isLoggedIn ? "font-semibold" : ""}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Your Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={isLoggedIn}
                    className={isLoggedIn ? "font-semibold" : ""}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={isLoggedIn}
                    className={isLoggedIn ? "font-semibold" : ""}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    ref={messageRef}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2Icon className="mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 size-4" />
                      Send
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
