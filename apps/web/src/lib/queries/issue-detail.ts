"use client";

import type { IssuePriority, IssueStatus, IssueType } from "@/lib/constants";
import { issueKeys } from "@/lib/queries/issues";
import { projectKeys } from "@/lib/queries/projects";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Person = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

// DB check 제약이 보장하는 값을 도메인 유니온으로 한 번만 좁혀,
// 소비처(Pill 등)에서 `as` 단언이 산개하지 않게 한다.
export type IssueDetail = Omit<Tables<"issues">, "status" | "type" | "priority"> & {
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  project: Pick<Tables<"projects">, "id" | "key" | "name" | "color"> | null;
  assignee: Person | null;
  reporter: Person | null;
  epic: Pick<Tables<"issues">, "id" | "key" | "title"> | null;
};

const DETAIL_SELECT = `
  *,
  project:projects(id, key, name, color),
  assignee:users!assignee_id(id, name, avatar_url),
  reporter:users!reporter_id(id, name, avatar_url),
  epic:issues!epic_id(id, key, title)
`;

export function useIssueDetail(issueKey: string) {
  return useQuery({
    queryKey: issueKeys.detail(issueKey),
    queryFn: async (): Promise<IssueDetail> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("issues")
        .select(DETAIL_SELECT)
        .eq("key", issueKey)
        .single();
      if (error) throw error;
      // self-참조 임베드(epic)는 PostgREST가 배열로 반환 → 단일 관계로 정규화
      const row = data as unknown as Omit<IssueDetail, "epic"> & {
        epic: IssueDetail["epic"] | IssueDetail["epic"][];
      };
      const epic = Array.isArray(row.epic) ? (row.epic[0] ?? null) : row.epic;
      return { ...row, epic };
    },
  });
}

/** 이슈 필드 부분 업데이트 (메타 패널 인라인 편집·상태 변경 공용) */
export function useUpdateIssue(issueKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: TablesUpdate<"issues">): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("issues").update(patch).eq("key", issueKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("issues").delete().eq("id", issueId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      // 홈 프로젝트 카드의 이슈 카운트 갱신 (create와 대칭)
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
