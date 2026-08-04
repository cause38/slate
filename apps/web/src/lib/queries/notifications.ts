"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Notification = Tables<"notifications">;

/** 알림 payload — 트리거(20260804000001)가 넣는 필드 */
export type NotificationPayload = {
  issue_id?: string;
  issue_key?: string;
  issue_title?: string;
  old?: string;
  new?: string;
  actor?: string | null;
  comment_id?: string;
};

const LIST_LIMIT = 30;
/** 벨을 자주 안 열어도 안읽음 뱃지가 갱신되도록 주기 폴링 (ms) */
const REFETCH_INTERVAL = 60_000;

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: async (): Promise<Notification[]> => {
      const supabase = createClient();
      // RLS(notifications_self)가 본인 것만 반환
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return data;
    },
  });
}

function useNotificationInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationRead() {
  const invalidate = useNotificationInvalidation();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useNotificationInvalidation();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      // RLS가 본인 행으로 한정 → 내 안읽음만 갱신
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
