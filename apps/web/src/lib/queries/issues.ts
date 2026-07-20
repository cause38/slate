"use client";

import { type Issue, fetchMyIssues } from "@/lib/queries/issues-shared";
import { projectKeys } from "@/lib/queries/projects";
import { createClient } from "@/lib/supabase/client";
import type { TablesInsert } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

/** key는 DB 트리거가 발급하므로 넣지 않는다 (절대 원칙 1) */
export type CreateIssueInput = Omit<TablesInsert<"issues">, "id" | "key" | "rank">;

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIssueInput): Promise<Issue> => {
      const supabase = createClient();
      // key 컬럼은 not null이지만 실제 값은 트리거가 발급 (빈 문자열은 트리거가 덮어씀)
      const { data, error } = await supabase
        .from("issues")
        .insert({ ...input, key: "" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      // 홈 프로젝트 카드의 이슈 카운트 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
