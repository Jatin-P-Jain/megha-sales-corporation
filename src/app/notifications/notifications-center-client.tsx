"use client";

import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useAuthState } from "@/context/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CheckCheck, Loader2, BellRing, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";

export default function NotificationsCenterClient({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  const { currentUser } = useAuthState();
  const router = useSafeRouter();

  const [loading, setLoading] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  const { items, unreadCount } = useRealtimeNotifications({
    uid: currentUser?.uid,
    includeItems: true,
    limit: 100,
  });

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  );
  const unreadItems = useMemo(
    () => sortedItems.filter((item) => !item.read),
    [sortedItems],
  );
  const olderItems = useMemo(
    () => sortedItems.filter((item) => item.read),
    [sortedItems],
  );
  const newNotificationsLabel =
    unreadItems.length === 1 ? "new notification" : "new notifications";

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;

    setLoading(true);
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    } finally {
      setLoading(false);
    }
  }, [unreadCount]);

  const openItem = useCallback(
    async (item: (typeof items)[number]) => {
      if (!item.read) {
        void markNotificationRead(item.id);
      }

      onNavigate?.();
      router.push(item.url || "/");
    },
    [onNavigate, router],
  );

  const renderNotificationCard = (item: (typeof items)[number]) => (
    <Card
      key={item.id}
      onClick={() => openItem(item)}
      className={clsx(
        "relative w-full cursor-pointer gap-1 border p-3 text-left",
        item.read ? "bg-white" : "bg-primary/5 border-primary",
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={clsx(
            "text-sm leading-tight font-medium",
            !item.read && "text-primary font-semibold",
          )}
        >
          {item.title}
        </p>
        {!item.read && (
          <span className="flex animate-pulse items-center gap-2 rounded-md px-3 py-0.5 text-sm text-red-700">
            <BellRing className="inline-flex size-4" />
          </span>
        )}
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
        {item.body}
      </p>
      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
        <Badge className="capitalize">{item.type}</Badge>
        <span>{formatDateTime(item.createdAt)}</span>
      </div>
    </Card>
  );

  const content = (
    <div className="pb-2">
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {sortedItems.length === 0 ? (
          <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
            No notifications yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-1">
            {unreadItems.length === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-muted-foreground flex items-center justify-center text-sm">
                  You have no new notifications.
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Show Older</span>
                  <Switch
                    checked={showOlder}
                    onCheckedChange={setShowOlder}
                    aria-label="Show older notifications"
                    disabled={olderItems.length === 0}
                  />
                </label>
              </div>
            ) : (
              unreadItems.map((item) => renderNotificationCard(item))
            )}

            {showOlder && olderItems.length > 0 && (
              <>
                <div className="text-muted-foreground px-1 pt-1 text-xs font-medium tracking-wide uppercase">
                  Older Notifications
                </div>
                {olderItems.map((item) => renderNotificationCard(item))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="top"
      dismissible={false}
      handleOnly
    >
      <DrawerContent className="z-50! mx-auto max-h-[85vh] max-w-3xl gap-3 px-4 pt-20 pb-4 md:pt-25">
        <DrawerHeader className="flex w-full flex-row items-center justify-between p-0">
          <DrawerTitle className="flex gap-2">
            <BellRing className="size-6" />
            Notifications
          </DrawerTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close notifications"
              className="p-0!"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DrawerHeader>
        {unreadCount > 0 && (
          <div className="flex w-full items-center justify-between">
            <div className="text-sm font-medium">
              {unreadItems.length} {newNotificationsLabel}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show Older</span>
              <Switch
                checked={showOlder}
                onCheckedChange={setShowOlder}
                aria-label="Show older notifications"
                disabled={olderItems.length === 0}
              />
            </label>
          </div>
        )}
        <div className="w-full">
          {content}
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={unreadCount === 0 || loading}
            onClick={handleMarkAllRead}
            className="flex w-full items-center justify-end gap-1"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <CheckCheck className="mr-1 size-4" /> Mark all read
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
