"use client";

import { useSafeRouter } from "@/hooks/useSafeRouter";
import { useAuthState } from "@/context/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CheckCheck, Loader2, BellRing } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

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

  const { items, unreadCount } = useRealtimeNotifications({
    uid: currentUser?.uid,
    includeItems: true,
    limit: 100,
  });

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  );

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

  const content = (
    <>
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || loading}
            onClick={handleMarkAllRead}
            className=""
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
      </div>

      <div className="px-6 pb-6">
        <ScrollArea className="h-[70vh] pr-2">
          {sortedItems.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              No notifications yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="hover:bg-muted/50 rounded-md border-b px-3 py-3 text-left transition-colors"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm leading-tight font-semibold">
                      {item.title}
                    </p>
                    {!item.read && (
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-cyan-600" />
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {item.body}
                  </p>
                  <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
                    <span className="capitalize">{item.type}</span>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="top">
      <DrawerContent className="z-50! mx-auto max-w-3xl pt-16 md:pt-20">
        <DrawerHeader className="flex w-full flex-row items-center justify-between p-4!">
          <DrawerTitle className="flex gap-2">
            <BellRing className="size-6" />
            Notification Center
          </DrawerTitle>
          <Badge variant="outline" className="h-full">
            Unread: {unreadCount}
          </Badge>
        </DrawerHeader>
        <div className="w-full px-4">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
