"use client";

import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useQuery } from "@tanstack/react-query";

type Actor = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

export type ActivityEntry = Tables<"activity_logs"> & {
  actor: Actor | null;
};

// issueKeys 하위에 두어 이슈 뮤테이션들의 issueKeys.all 무효화가 활동 목록까지
// prefix 매칭으로 갱신되게 한다 (메타 편집 → 트리거 기록 → 활동 탭 즉시 반영).
export const activityKeys = {
  byIssue: (issueId: string) => [...issueKeys.all, "activity", issueId] as const,
};

export function useActivityLogs(issueId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.byIssue(issueId ?? ""),
    enabled: Boolean(issueId),
    queryFn: async (): Promise<ActivityEntry[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, actor:users!actor_id(id, name, avatar_url)")
        .eq("issue_id", issueId ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ActivityEntry[];
    },
  });
}
