// components/HelpDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { FullUser } from "@/types/user";
import clsx from "clsx";
import { toast } from "sonner";
import { Loader2Icon, SendIcon } from "lucide-react";
import { generateSequenceId } from "@/lib/firebase/generateSequenceId";
import { saveEnquiry } from "@/app/enquiries/actions";
import { Enquiry } from "@/types/enquiry";
import { useSafeRouter } from "@/hooks/useSafeRouter";

export default function HelpDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FullUser;
}) {
  const router = useSafeRouter();
  const prefill = useMemo(
    () => ({
      name: user.displayName ?? "",
      phone: user.phone ?? "",
      email: user.email ?? "",
    }),
    [user.displayName, user.phone, user.email],
  );

  const [form, setForm] = useState({
    name: prefill.name,
    phone: prefill.phone,
    email: prefill.email,
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ✅ Sync form with user data when dialog opens or user changes
  useEffect(() => {
    if (!open) return;

    setForm((prev) => ({
      ...prev,
      name: prefill.name,
      phone: prefill.phone,
      email: prefill.email,
      message: "", // reset message every time dialog opens
    }));
  }, [open, prefill.name, prefill.phone, prefill.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error("Message is required.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Generate custom Enquiry ID
      const customEnquiryId = await generateSequenceId("enquiries");
      if (!customEnquiryId) {
        throw new Error("Failed to generate enquiry ID");
      }
      const response = await fetch("/api/wa-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: "enquiry_received_to_admin",
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
          customerMessage: form.message,
          customerWANumber: form.phone,
          enquiryId: customEnquiryId, // Use the generated custom enquiry ID
        }),
      });

      if (response.ok) {
        const savedEnquiryResponse = await saveEnquiry({
          id: customEnquiryId,
          userId: user.uid,
          conversation: [
            {
              text: form.message,
              sentAt: new Date().toISOString(),
              messageBy: user || {
                displayName: form.name,
                phone: form.phone,
                email: form.email,
              },
            },
          ],
          createdBy: user || {
            displayName: form.name,
            phone: form.phone,
            email: form.email,
          },
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Enquiry);
        if (savedEnquiryResponse.success === false) {
          throw new Error(
            savedEnquiryResponse.error || "Failed to save enquiry",
          );
        }
        toast.success("Thanks for Reaching Out!", {
          description: "We've received your enquiry. You'll hear from us soon!",
        });
        onOpenChange(false);
        // Keep prefill, only clear message for next time
        setForm((prev) => ({ ...prev, message: "" }));
        // Optional: Redirect to enquiry details page after submission
        router.replace(`/enquiries?page=1`);
      } else {
        throw new Error("Failed to send enquiry");
      }
    } catch (err) {
      console.log(err);
      toast.error("Oops! Something Went Wrong", {
        description: "We couldn't send your query. Please try again shortly.",
      });
    } finally {
      setSubmitting(false);
    }
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
            readOnly={!!prefill.name}
            className={clsx({ "font-semibold": !!prefill.name })}
          />

          <Input
            name="phone"
            placeholder="Your Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            readOnly={!!prefill.phone}
            className={clsx({ "font-semibold": !!prefill.phone })}
          />

          <Input
            name="email"
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
            readOnly={!!prefill.email}
            className={clsx({ "font-semibold": !!prefill.email })}
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
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => {
                  // Optional: clear only message when cancelling
                  setForm((prev) => ({ ...prev, message: "" }));
                }}
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
