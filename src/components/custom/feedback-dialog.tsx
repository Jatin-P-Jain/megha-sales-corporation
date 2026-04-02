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
import { Loader2Icon, SendIcon, CheckCircle2, Star } from "lucide-react";
import { useAuthState } from "@/context/useAuth";
import { toast } from "sonner";
import { generateSequenceId } from "@/lib/firebase/generateSequenceId";
import { useRequireUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { saveFeedback } from "@/app/about-contact/actions";

type FeedbackDialogProps = {
  trigger: React.ReactNode;
};

const getSentimentDetails = (rating: number) => {
  if (rating === 5) {
    return {
      sentiment: "Excellent",
      template:
        "I had an excellent experience. Everything was smooth, quick, and very helpful.",
    };
  }
  if (rating === 4) {
    return {
      sentiment: "Good",
      template:
        "I had a good experience overall. A few small improvements could make it even better.",
    };
  }
  if (rating === 3) {
    return {
      sentiment: "Average",
      template:
        "My experience was okay overall. Some parts worked well, and some could be improved.",
    };
  }
  if (rating === 2) {
    return {
      sentiment: "Below Average",
      template:
        "My experience was below expectations. I would appreciate improvements in service and response time.",
    };
  }
  if (rating === 1) {
    return {
      sentiment: "Poor",
      template:
        "I am not satisfied with the experience. I faced multiple issues that need attention.",
    };
  }

  return {
    sentiment: "Not Rated",
    template: "",
  };
};

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const { currentUser } = useAuthState();
  const isLoggedIn = !!currentUser;

  useRequireUserProfile(true);
  const { clientUser } = useUserProfileState();

  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setName(clientUser?.displayName ?? "");
      setPhone(clientUser?.phone ?? "");
      setEmail(clientUser?.email ?? "");
    } else if (!isLoggedIn) {
      setName("");
      setPhone("");
      setEmail("");
    }
    setRating(0);
    setMessage("");
    setIsSent(false);
  }, [
    isOpen,
    clientUser?.displayName,
    clientUser?.phone,
    clientUser?.email,
    isLoggedIn,
  ]);

  useEffect(() => {
    if (!isOpen || isSent) return;
    if (isLoggedIn && messageRef.current) {
      messageRef.current.focus();
    } else if (!isLoggedIn && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen, isSent, isLoggedIn]);

  const sentimentDetails = getSentimentDetails(rating);

  const handleRatingClick = (value: number) => {
    const boundedRating = Math.min(5, Math.max(0, value));
    setRating(boundedRating);
    setMessage(getSentimentDetails(boundedRating).template);
  };

  const handleSendClick = async () => {
    if (!message.trim()) {
      toast.error("Please add a message before sending.");
      return;
    }
    setIsSending(true);

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
          templateKey: "feedback_received_to_admin",
          customerName: name,
          customerPhone: phone,
          customerMessage: message,
          customerWANumber: phone,
          enquiryId: customEnquiryId, // Use the generated custom enquiry ID
        }),
      });
      if (response.ok) {
        setIsSent(true);
        const guestUserId = await generateSequenceId("guestUsers");
        const savedFeedbackResponse = await saveFeedback({
          user: {
            id: clientUser?.uid ?? guestUserId,
            name: clientUser?.displayName ?? name,
            email: clientUser?.email ?? email,
            phone: clientUser?.phone ?? phone,
          },
          rating,
          message,
        });
        if (savedFeedbackResponse.success === false) {
          throw new Error(
            savedFeedbackResponse.error || "Failed to save feedback",
          );
        }
        toast.success("Thanks for reaching out!", {
          description: "Your feedback has been received. Thank You!",
        });
      } else {
        toast.error("We couldn't send your message.", {
          description: "Please try again in a moment.",
        });
      }
    } catch (err) {
      console.error(
        "Feedback submission failed:",
        err instanceof Error ? err.message : err,
      );
      toast.error("Something went wrong", {
        description: "Your feedback wasn't sent. Please try again in a moment.",
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
      <DialogContent
        className="p-4 md:p-8"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="size-10 text-green-600" />
            <p className="text-muted-foreground text-center text-sm">
              Thank you for taking the time to share your feedback.
            </p>
            <Button className={"w-1/2"} onClick={handleOkClick}>
              Close
            </Button>
          </div>
        ) : (
          <Card className="p-4 shadow-none">
            <CardContent className="space-y-4 p-0">
              <p className="text-muted-foreground text-center text-xs md:text-sm">
                We read every message and appreciate your thoughts.
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
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    ref={nameInputRef}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                    readOnly={isLoggedIn}
                    className={isLoggedIn ? "font-semibold" : ""}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone Number
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
                    Email
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
                  <label className="block text-sm font-medium">Rating</label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isActive = starValue <= rating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          aria-label={`Rate ${starValue} out of 5`}
                          onClick={() => handleRatingClick(starValue)}
                          className="rounded-sm p-1 transition hover:scale-105"
                        >
                          <Star
                            className={`size-5 ${
                              isActive
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleRatingClick(0)}
                    >
                      Reset
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {`Rating: ${rating}/5 | Sentiment: ${sentimentDetails.sentiment}`}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium"
                  >
                    Message
                  </label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Selecting stars can generate a starter message. You can edit
                    it as you like.
                  </p>
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
                      Sending your message...
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 size-4" />
                      Send Message
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
