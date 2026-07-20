"use client";

import { fetchMyIssues } from "@/lib/queries/issues-shared";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type { Issue, IssueWithProject } from "@/lib/queries/issues-shared";

export const issueKeys = {
  all: ["issues"] as const,
  mine: (userId: string) => [...issueKeys.all, "mine", userId] as const,
  detail: (issueKey: string) => [...issueKeys.all, "detail", issueKey] as const,
};

export function useMyIssues(userId: string | undefined) {
  return useQuery({
    queryKey: issueKeys.mine(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: () => fetchMyIssues(createClient(), userId ?? ""),
  });
}
