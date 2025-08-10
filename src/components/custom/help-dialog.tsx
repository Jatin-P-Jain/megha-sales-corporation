// components/HelpDialog.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserData } from "@/types/user";
import clsx from "clsx";
import { toast } from "sonner";
import { Loader2Icon, SendIcon } from "lucide-react";

export default function HelpDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
}) {
  const [form, setForm] = useState({
    name: user.displayName ?? "",
    phone: user.phone ?? "",
    email: user.email ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: handle API submission logic here
    try {
      const response = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "customer_inquiry_recieved",
          customerName: user.displayName,
          customerPhone: user.phone,
          customerMessage: form.message,
          customerWANumber: user.phone,
        }),
      });

      if (response.ok) {
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
    }
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need Help?</DialogTitle>
          <DialogDescription>
            Describe your concern below and we will get back to you soon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            required
            readOnly={!!form.name}
            className={clsx({ "font-semibold": !!form.name })}
          />
          <Input
            name="phone"
            placeholder="Your Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            readOnly={!!form.phone}
            className={clsx({ "font-semibold": !!form.phone })}
          />
          <Input
            name="email"
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
            readOnly={!!form.email}
            className={clsx({ "font-semibold": !!form.email })}
          />
          <Textarea
            name="message"
            placeholder="Your Message"
            value={form.message}
            onChange={handleChange}
            required
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex flex-row items-center justify-center gap-2">
                  <Loader2Icon className="animate-spin" />
                  Sending
                </span>
              ) : (
                <span className="flex flex-row items-center justify-center gap-2">
                  <SendIcon className="size-4" />
                  Send
                </span>
              )}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
