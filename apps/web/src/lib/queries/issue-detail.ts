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
    // 낙관적 반영이 없으면 저장 후 재조회가 끝날 때까지 옛 값이 남아 화면이 한 번 깜빡인다.
    // 제목·본문 인라인 편집에서 특히 두드러진다. assignee_id 처럼 조인 객체로 표시되는
    // 필드는 스칼라만 바뀌어 화면에 안 보이지만, 재조회가 곧 바로잡으므로 해롭지 않다.
    onMutate: async (patch) => {
      const detailKey = issueKeys.detail(issueKey);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<IssueDetail>(detailKey);
      queryClient.setQueryData<IssueDetail>(detailKey, (old) =>
        // patch 는 TablesUpdate 라 status 등이 넓은 타입이다. DB check 제약이 값을 보장하므로
        // 도메인 유니온으로 다시 좁힌다(useIssueDetail 이 하는 것과 같은 근거).
        old ? ({ ...old, ...patch } as IssueDetail) : old,
      );
      return { previous };
    },
    // 메타 패널의 인라인 편집은 호출부가 8곳인데 어디도 onError 를 넘기지 않는다.
    // 실패하면 값만 되돌아가고 이유가 안 보이므로 훅에서 한 번에 덮는다.
    onError: (error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(issueKeys.detail(issueKey), context.previous);
      }
      toast.error("변경에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
