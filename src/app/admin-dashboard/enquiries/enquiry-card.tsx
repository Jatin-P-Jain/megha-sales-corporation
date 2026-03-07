"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import DefaultUserIcon from "@/assets/icons/user.png";
import { Enquiry } from "@/types/enquiry";
import { formatDateTime } from "@/lib/utils";

interface EnquiryCardProps {
  enquiry: Enquiry;
  isAdmin: boolean;
  onStatusChange: (status: Enquiry["status"]) => Promise<void>;
  onReply: (replyText: string) => Promise<void>;
}

export default function EnquiryCard({
  enquiry,
  isAdmin,
  onStatusChange,
  onReply,
}: EnquiryCardProps) {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [status, setStatus] = useState(enquiry.status);

  const isResolved = status === "resolved";
  const canReply = !isResolved;
  const canChangeStatus = isAdmin;

  const sentBy = "sentBy" in enquiry ? enquiry.sentBy : enquiry;
  const replies = enquiry.replies || [];

  const handleStatusUpdate = async (newStatus: Enquiry["status"]) => {
    try {
      await onStatusChange(newStatus);
      setStatus(newStatus);
      toast.success(`Enquiry marked as ${newStatus}`);
    } catch (error) {
      console.log(error);

      toast.error("Failed to update status");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !canReply) return;

    setIsReplying(true);
    try {
      await onReply(replyText.trim());
      setReplyText("");
      toast.success("Reply sent successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: Enquiry["status"]) => {
    const badges = {
      pending: { color: "yellow", icon: Clock, label: "Pending" },
      "in-progress": {
        color: "blue",
        icon: MessageCircle,
        label: "In Progress",
      },
      resolved: { color: "green", icon: CheckCircle2, label: "Resolved" },
    };
    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <Badge className={`bg-${badge.color}-100 text-${badge.color}-700`}>
        <Icon className="mr-1 h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  return (
    <Card className="mx-auto flex h-[500px] max-w-2xl flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              {sentBy.photoUrl ? (
                <AvatarImage src={sentBy.photoUrl} alt={sentBy.displayName} />
              ) : (
                <AvatarFallback>
                  <Image
                    src={DefaultUserIcon}
                    alt="User"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg font-semibold">
                {sentBy.displayName || "Anonymous"}
              </CardTitle>
              <p className="text-muted-foreground truncate text-sm">
                {sentBy.email || sentBy.phone || "No contact"}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(enquiry.createdAt)} •{" "}
                {enquiry.enquiryText.slice(0, 80)}...
              </p>
            </div>
          </div>

          {canChangeStatus && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                Status:
              </span>
              <Select value={status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!canChangeStatus && (
            <div className="flex flex-shrink-0 items-center gap-1">
              {getStatusBadge(status)}
            </div>
          )}
        </div>
      </CardHeader>

      <Separator />

      {/* Chat Messages */}
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* Original Enquiry */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={sentBy.photoUrl} />
              <AvatarFallback>{sentBy.displayName?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {sentBy.displayName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(enquiry.createdAt)}
                </span>
              </div>
              <p className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
                {enquiry.enquiryText}
              </p>
            </div>
          </div>

          {/* Replies */}
          {replies.map((reply, index) => (
            <div
              key={index}
              className={`flex gap-3 ${reply.repliedBy === sentBy ? "" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] min-w-0 flex-1 ${
                  reply.repliedBy === sentBy
                    ? "order-2"
                    : "order-1 flex-row-reverse"
                }`}
              >
                <div
                  className={`rounded-2xl p-3 ${
                    reply.repliedBy === sentBy
                      ? "bg-background rounded-br-sm border"
                      : "bg-primary text-primary-foreground rounded-bl-sm"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {reply.repliedBy.displayName ||
                        reply.repliedBy.displayName ||
                        "Admin"}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatDateTime(reply.repliedAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {reply.text}
                  </p>
                </div>
              </div>

              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={reply.repliedBy.photoUrl} />
                <AvatarFallback>
                  {reply.repliedBy.displayName?.[0] ||
                    reply.repliedBy.displayName?.[0] ||
                    "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>

        {/* Reply Input - only if not resolved */}
        {canReply && (
          <div className="bg-background border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[44px] flex-1 resize-none"
                disabled={isReplying}
                rows={1}
              />
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isReplying}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
