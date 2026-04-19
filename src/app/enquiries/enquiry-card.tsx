"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  MoreVertical,
  Eye,
  EyeClosed,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import clsx from "clsx";
import DefaultUserIcon from "@/assets/icons/user.png";
import {
  notifyAdminRecipientsAction,
  notifyUserAction,
} from "@/actions/notify-user";
import { Enquiry } from "@/types/enquiry";
import { formatDateTime, getBaseUrl } from "@/lib/utils";
import { FullUser } from "@/types/user";
import { Input } from "@/components/ui/input";

interface EnquiryCardProps {
  enquiry: Enquiry;
  isAdmin: boolean;
  loggedInUser: FullUser;
  onStatusChange: (status: Enquiry["status"]) => Promise<void>;
  onReply: (replyText: string) => Promise<void>;
  onUpdate?: (updatedEnquiry: Enquiry) => void;
}

export default function EnquiryCard({
  enquiry,
  isAdmin,
  loggedInUser,
  onStatusChange,
  onReply,
  onUpdate,
}: EnquiryCardProps) {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const createdBy = "createdBy" in enquiry ? enquiry.createdBy : enquiry;
  const notificationUid =
    "uid" in createdBy && createdBy.uid ? createdBy.uid : enquiry.userId;

  const isResolved = enquiry.status === "resolved";
  const canReply = !isResolved;

  const handleStatusUpdate = async (newStatus: Enquiry["status"]) => {
    if (newStatus === enquiry.status) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusChange(newStatus);

      // Optimistic update - update the enquiry locally without page refresh
      if (onUpdate) {
        onUpdate({
          ...enquiry,
          status: newStatus,
        });
      }

      if (notificationUid) {
        await notifyUserAction({
          uid: notificationUid,
          type: "enquiry",
          title: "💬 Enquiry Update",
          body: `Your enquiry #${enquiry.id} has been updated!`,
          url: `${getBaseUrl()}/enquiries?searchField=id&searchQuery=${enquiry.id}`,
          clickAction: "view_enquiry",
          status: "updated",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !canReply) return;

    const text = replyText.trim();
    setIsReplying(true);

    try {
      await onReply(text);

      // Optimistic update - add the new message locally
      if (onUpdate) {
        onUpdate({
          ...enquiry,
          conversation: [
            ...(enquiry.conversation || []),
            {
              text,
              sentAt: new Date().toISOString(),
              messageBy: {
                uid: loggedInUser.uid,
                displayName: loggedInUser.displayName || "You",
                email: loggedInUser.email || "",
                phone: loggedInUser.phone || "",
                photoUrl: loggedInUser.photoUrl || "",
              },
            },
          ],
          // Auto-update status from pending to in-progress only when admin replies
          status:
            isAdmin && enquiry.status === "pending"
              ? "in-progress"
              : enquiry.status,
        });
      }

      setReplyText("");
      toast.success("Reply sent successfully");

      // In-app notification: admin replied → notify user; user replied → notify admins
      if (isAdmin) {
        if (notificationUid) {
          void notifyUserAction({
            uid: notificationUid,
            type: "enquiry",
            title: "💬 New Reply on Your Enquiry",
            body: `Admin replied to your enquiry #${enquiry.id}.`,
            url: `${getBaseUrl()}/enquiries?searchField=id&searchQuery=${enquiry.id}`,
            clickAction: "view_enquiry",
            status: "updated",
            pushOnly: true,
          });
        }
      } else {
        void notifyAdminRecipientsAction({
          recipientsMode: "role-admin-only",
          type: "enquiry",
          title: "💬 New Reply on Enquiry",
          body: `${loggedInUser.displayName || "A user"} replied to enquiry #${enquiry.id}.`,
          url: `${getBaseUrl()}/admin-dashboard/enquiries?searchField=id&searchQuery=${enquiry.id}`,
          clickAction: "view_enquiry",
          status: "updated",
          pushOnly: true,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (value: Enquiry["status"]) => {
    switch (value) {
      case "in-progress":
        return (
          <Badge className="h-full border border-sky-700 bg-sky-100 py-1 text-xs font-medium text-sky-700 hover:bg-sky-200 md:text-sm">
            <MessageCircle className="size-4!" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="h-full border border-green-700 bg-green-100 py-1 text-xs font-medium text-green-700 hover:bg-green-200 md:text-sm">
            <CheckCircle2 className="size-4!" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge className="h-full border border-yellow-700 bg-yellow-100 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 md:text-sm">
            <Clock className="size-4!" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="bg-primary/10 p-3">
        <div className="flex h-full flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex w-full flex-col items-start gap-1 md:gap-2">
            <div className="text-muted-foreground flex w-full flex-1 flex-col items-start gap-1 text-sm md:flex-row md:items-center md:gap-2">
              <span className="text-xs font-medium whitespace-nowrap">
                # Enquiry ID:
              </span>
              <span className="text-foreground font-mono text-base font-semibold whitespace-nowrap">
                {enquiry.id || "N/A"}
              </span>
            </div>
            {!isAdmin && (
              <span className="text-muted-foreground flex w-full items-center gap-1 text-xs font-medium whitespace-nowrap">
                <span className="font-normal">Request raised on </span>
                {formatDateTime(enquiry.createdAt)}
              </span>
            )}
            {isAdmin && (
              <div className="bg-accent flex w-full flex-col items-start justify-between gap-2 rounded-md p-1 px-2 text-sm md:flex-row md:items-end md:gap-8">
                <div className="text-muted-foreground flex items-center gap-2">
                  <span className="text-xs whitespace-nowrap">
                    Created By :{" "}
                  </span>
                  <Avatar className="h-5 w-5 border border-white shadow-md md:h-8 md:w-8">
                    {createdBy.photoUrl ? (
                      <AvatarFallback className="bg-transparent p-0">
                        <Image
                          src={createdBy.photoUrl}
                          alt={createdBy.displayName || "User"}
                          width={32}
                          height={32}
                          className="h-full w-full rounded-full object-cover"
                          unoptimized={createdBy.photoUrl.startsWith("blob:")}
                        />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback>
                        <Image
                          src={DefaultUserIcon}
                          alt="avatar"
                          width={48}
                          height={48}
                          className="rounded-full object-cover p-1"
                        />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs md:text-sm">
                      {createdBy.displayName || "Anonymous"}
                    </span>
                    <p className="text-muted-foreground truncate text-xs md:text-sm">
                      {createdBy.email || createdBy.phone || "No contact"}
                    </p>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
                  {formatDateTime(enquiry.createdAt)}
                </span>
              </div>
            )}
          </div>
          <div className="flex w-full flex-col items-end justify-center gap-3">
            <div className="flex w-full items-center justify-between gap-0 md:justify-end md:gap-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(enquiry.status)}
              </div>
              {isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingStatus}
                      className="w-auto text-xs md:text-sm"
                    >
                      Mark as
                      <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>Update status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleStatusUpdate("pending")}
                    >
                      <Clock className="h-4 w-4" />
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleStatusUpdate("in-progress")}
                    >
                      <MessageCircle className="h-4 w-4" />
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleStatusUpdate("resolved")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolved
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div
                  onClick={() => setIsDetailsOpen((prev) => !prev)}
                  className={clsx(
                    "whitespace-nowra flex cursor-pointer items-center justify-between gap-2",
                  )}
                >
                  <span className="text-muted-foreground text-xs font-medium md:text-sm">
                    {isDetailsOpen ? "Hide" : "Show"} conversation
                  </span>
                  {isDetailsOpen ? (
                    <EyeClosed className="text-muted-foreground size-4 md:size-5" />
                  ) : (
                    <Eye className="text-muted-foreground size-4 md:size-5" />
                  )}
                </div>
              )}
            </div>
            {isAdmin && (
              <div
                onClick={() => setIsDetailsOpen((prev) => !prev)}
                className={clsx(
                  "flex cursor-pointer items-center justify-between gap-2 whitespace-nowrap",
                )}
              >
                <span className="text-muted-foreground text-sm font-medium">
                  {isDetailsOpen ? "Hide" : "Show"} conversation
                </span>
                {isDetailsOpen ? (
                  <EyeClosed className="text-muted-foreground size-5" />
                ) : (
                  <Eye className="text-muted-foreground size-5" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {isDetailsOpen && (
        <CardContent className="space-y-3 p-2 md:space-y-3 md:p-3">
          <div className="no-scrollbar max-h-80 space-y-1 overflow-y-auto pr-1">
            {(enquiry.conversation || []).map((conv, index) => {
              const messageUid = (conv.messageBy as { uid?: string })?.uid;
              const viewerUid = loggedInUser?.uid;
              const messageEmail = conv.messageBy?.email;
              const viewerEmail = loggedInUser?.email;

              const isOwnMessage =
                (messageUid && viewerUid && messageUid === viewerUid) ||
                (!!messageEmail &&
                  !!viewerEmail &&
                  messageEmail === viewerEmail);

              return (
                <div
                  key={index}
                  className={clsx("flex gap-1", isOwnMessage && "justify-end")}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={clsx(
                        "flex items-end justify-end gap-2 rounded-2xl p-1 px-3 text-right",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none",
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {conv.text}
                      </p>
                      <span
                        className={clsx(
                          "text-muted-foreground block text-[10px]",
                          isOwnMessage ? "text-muted/50!" : "",
                        )}
                      >
                        {formatDateTime(conv.sentAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {canReply && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="resize-none text-sm"
                  disabled={isReplying}
                  // rows={1}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isReplying}
                  className="h-full! shrink-0"
                >
                  <Send className="size-5" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
