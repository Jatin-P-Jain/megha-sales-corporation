"use client";

import {
  CheckCircle2,
  ShieldOff,
  Image,
  FileText,
  User,
  Clock,
  MailCheck,
  Smartphone,
  UserRoundX,
  UserRoundMinus,
  UserRoundPlus,
  Link,
  ShieldEllipsis,
} from "lucide-react";
import type {
  AccountTimelineEventType,
  AccountTimelineEvent,
} from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const eventConfig: Record<
  AccountTimelineEventType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  account_created: {
    icon: UserRoundPlus,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  name_updated: { icon: User, color: "text-zinc-600", bg: "bg-zinc-100" },
  photo_updated: { icon: Image, color: "text-purple-600", bg: "bg-purple-50" },
  pan_added: { icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  gst_added: { icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
  email_linked: { icon: MailCheck, color: "text-zinc-600", bg: "bg-zinc-100" },
  phone_linked: {
    icon: Smartphone,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  google_linked: { icon: Link, color: "text-green-500", bg: "bg-green-50" },
  profile_submitted: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  account_approved: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  account_rejected: {
    icon: UserRoundX,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  account_suspended: {
    icon: UserRoundMinus,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  account_deactivated: {
    icon: ShieldOff,
    color: "text-zinc-500",
    bg: "bg-zinc-100",
  },
  role_assigned: {
    icon: ShieldEllipsis,
    color: "text-sky-700",
    bg: "bg-sky-50",
  },
};

function TimelineItem({
  event,
  itemPosition,
}: {
  event: AccountTimelineEvent;
  itemPosition: "first" | "middle" | "last";
}) {
  const cfg = eventConfig[event.type] ?? {
    icon: Clock,
    color: "text-zinc-500",
    bg: "bg-zinc-100",
  };
  const Icon = cfg.icon;
  const timeStr = timeAgo(event.createdAt);

  return (
    <li className="relative flex gap-2">
      {/* vertical connector line */}
      {itemPosition !== "last" && (
        <div className="bg-secondary-foreground/20 absolute top-7 left-3.5 h-full w-px" />
      )}

      <span
        className={cn(
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          cfg.bg,
        )}
      >
        <Icon className={cn("size-3.5", cfg.color)} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col pb-5">
        <span className="text-secondary-foreground text-xs font-medium md:text-sm">
          {event.label} {event.detail && `to "${event.detail}"`}
        </span>

        <span className="text-secondary-foreground/60 text-[10px] md:text-xs">
          {timeStr} | {formatDateTime(event.createdAt)}
        </span>
      </div>
    </li>
  );
}

type Props = {
  events: AccountTimelineEvent[];
  loading: boolean;
};

export function AccountTimeline({ events, loading }: Props) {
  if (loading) {
    return (
      <ul className="space-y-4 py-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-secondary/80 py-2 text-center text-xs md:py-3 md:text-sm">
        No activity yet.
      </p>
    );
  }

  return (
    <ul className="">
      {events.map((event, i) => (
        <TimelineItem
          key={event.id}
          event={event}
          itemPosition={
            i === 0 ? "first" : i === events.length - 1 ? "last" : "middle"
          }
        />
      ))}
    </ul>
  );
}
