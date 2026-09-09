"use client";

import type { IssuePriority, IssueStatus, IssueType } from "@/lib/constants";
import { assertWritten } from "@/lib/queries/assert-written";
import { issueKeys } from "@/lib/queries/issues";
import { projectKeys } from "@/lib/queries/projects";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Person = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

// DB check 제약이 보장하는 값을 도메인 유니온으로 한 번만 좁혀,
// 소비처(Pill 등)에서 `as` 단언이 산개하지 않게 한다.
export type IssueLabel = Pick<Tables<"labels">, "id" | "name" | "color">;

export type IssueDetail = Omit<Tables<"issues">, "status" | "type" | "priority"> & {
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  project: Pick<Tables<"projects">, "id" | "key" | "name" | "color"> | null;
  assignee: Person | null;
  reporter: Person | null;
  epic: Pick<Tables<"issues">, "id" | "key" | "title"> | null;
  labels: IssueLabel[];
};

const DETAIL_SELECT = `
  *,
  project:projects(id, key, name, color),
  assignee:users!assignee_id(id, name, avatar_url),
  reporter:users!reporter_id(id, name, avatar_url),
  epic:issues!epic_id(id, key, title),
  labels:issue_labels(label:labels(id, name, color))
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
      // self-참조 임베드(epic)는 PostgREST가 배열로 반환 → 단일 관계로 정규화.
      // labels는 issue_labels 조인 테이블 경유라 [{ label: {...} }] 형태 → 평탄화.
      const row = data as unknown as Omit<IssueDetail, "epic" | "labels"> & {
        epic: IssueDetail["epic"] | IssueDetail["epic"][];
        labels: { label: IssueLabel | null }[];
      };
      const epic = Array.isArray(row.epic) ? (row.epic[0] ?? null) : row.epic;
      const labels = row.labels
        .map((entry) => entry.label)
        .filter((label): label is IssueLabel => label !== null);
      return { ...row, epic, labels };
    },
  });
}

/** 이슈 필드 부분 업데이트 (메타 패널 인라인 편집·상태 변경 공용) */
export function useUpdateIssue(issueKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: TablesUpdate<"issues">): Promise<void> => {
      const supabase = createClient();
      const result = await supabase.from("issues").update(patch).eq("key", issueKey).select("id");
      assertWritten(result, "이슈를 수정하지 못했어요");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
    // 메타 패널의 인라인 편집은 호출부가 8곳인데 어디도 onError 를 넘기지 않는다.
    // 실패하면 값만 되돌아가고 이유가 안 보이므로 훅에서 한 번에 덮는다.
    onError: (error) => {
      toast.error("변경에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: string): Promise<void> => {
      const supabase = createClient();
      const result = await supabase.from("issues").delete().eq("id", issueId).select("id");
      assertWritten(result, "이슈를 삭제하지 못했어요");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      // 홈 프로젝트 카드의 이슈 카운트 갱신 (create와 대칭)
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
