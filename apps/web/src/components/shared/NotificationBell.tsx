"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ISSUE_STATUS_LABELS, type NotificationType, isIssueStatus } from "@/lib/constants";
import {
  type Notification,
  type NotificationPayload,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function statusLabel(value: string | undefined): string {
  return value && isIssueStatus(value) ? ISSUE_STATUS_LABELS[value] : (value ?? "?");
}

function payloadOf(notification: Notification): NotificationPayload {
  // 트리거가 항상 객체를 넣으므로 안전 — Supabase Json 타입만 좁힌다
  return (notification.payload ?? {}) as NotificationPayload;
}

// 알림 type → 한 줄 문구. Record<NotificationType>라 트리거가 type을 추가하면 TS가 누락을 잡는다.
// issue 이벤트의 actor는 null=시스템 가능(상태 변경만 시스템 경로 존재).
const MESSAGE_BUILDERS: Record<NotificationType, (payload: NotificationPayload) => string> = {
  assigned: () => "담당자로 지정됐어요",
  status_changed: (payload) =>
    `${payload.actor == null ? "시스템: " : ""}상태 변경 ${statusLabel(payload.old)} → ${statusLabel(payload.new)}`,
  commented: () => "새 코멘트가 달렸어요",
};

function describe(notification: Notification): string {
  const build = MESSAGE_BUILDERS[notification.type as NotificationType];
  return build ? build(payloadOf(notification)) : notification.type;
}

export function NotificationBell() {
  const router = useRouter();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);

  const items = notifications ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  function handleSelect(notification: Notification) {
    if (!notification.read_at) markRead.mutate(notification.id);
    const payload = payloadOf(notification);
    setOpen(false);
    if (payload.issue_key) router.push(`/i/${payload.issue_key}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={unread > 0 ? `알림, 안 읽음 ${unread}개` : "알림"}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">알림</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length ? (
            items.map((notification) => {
              const payload = payloadOf(notification);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleSelect(notification)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted",
                    !notification.read_at && "bg-primary/5",
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    {!notification.read_at && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {describe(notification)}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  {payload.issue_key && (
                    <span className="pl-3.5 text-xs text-muted-foreground">
                      <span className="font-mono">{payload.issue_key}</span> {payload.issue_title}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">새 알림이 없어요.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
