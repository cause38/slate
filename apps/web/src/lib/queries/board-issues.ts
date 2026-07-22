"use client";

import type { IssuePriority, IssueStatus, IssueType } from "@/lib/constants";
import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Assignee = Pick<Tables<"users">, "id" | "name" | "avatar_url">;
type IssueLabelLite = Pick<Tables<"labels">, "id" | "name" | "color">;

// 보드/백로그 카드가 쓰는 이슈 서브셋 (도메인 유니온으로 좁힘)
export type BoardIssue = Pick<
  Tables<"issues">,
  "id" | "key" | "title" | "story_points" | "sprint_id" | "rank" | "due_date"
> & {
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  assignee: Assignee | null;
  labels: IssueLabelLite[];
};

const BOARD_SELECT = `
  id, key, title, status, type, priority, story_points, sprint_id, rank, due_date,
  assignee:users!assignee_id(id, name, avatar_url),
  labels:issue_labels(label:labels(id, name, color))
`;

// issueKeys 하위에 두어 useCreateIssue/useUpdateIssue/useDeleteIssue/useCompleteSprint의
// issueKeys.all 무효화가 보드·백로그까지 prefix 매칭으로 갱신되게 한다.
export const boardIssueKeys = {
  byProject: (projectId: string) => [...issueKeys.all, "board", projectId] as const,
};

/** 한 프로젝트의 모든 이슈 (보드·백로그가 sprint_id/status로 그룹핑) */
export function useProjectIssues(projectId: string | undefined) {
  return useQuery({
    queryKey: boardIssueKeys.byProject(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async (): Promise<BoardIssue[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("issues")
        .select(BOARD_SELECT)
        .eq("project_id", projectId ?? "")
        .order("rank", { nullsFirst: false })
        .order("created_at");
      if (error) throw error;
      const rows = data as unknown as (Omit<BoardIssue, "labels"> & {
        labels: { label: IssueLabelLite | null }[];
      })[];
      return rows.map((row) => ({
        ...row,
        labels: row.labels.map((l) => l.label).filter((l): l is IssueLabelLite => l !== null),
      }));
    },
  });
}

/** 보드 드래그용 상태 변경 — 낙관적 업데이트로 카드가 즉시 컬럼 이동 */
export function useUpdateIssueStatus(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardIssueKeys.byProject(projectId);

  return useMutation({
    mutationFn: async (input: { issueId: string; status: IssueStatus }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("issues")
        .update({ status: input.status })
        .eq("id", input.issueId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardIssue[]>(queryKey);
      queryClient.setQueryData<BoardIssue[]>(queryKey, (old) =>
        old?.map((issue) =>
          issue.id === input.issueId ? { ...issue, status: input.status } : issue,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

/** 백로그 드래그용 스프린트 이동 — sprint_id 변경 (null = 백로그). 낙관적 */
export function useUpdateIssueSprint(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardIssueKeys.byProject(projectId);

  return useMutation({
    mutationFn: async (input: { issueId: string; sprintId: string | null }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("issues")
        .update({ sprint_id: input.sprintId })
        .eq("id", input.issueId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardIssue[]>(queryKey);
      queryClient.setQueryData<BoardIssue[]>(queryKey, (old) =>
        old?.map((issue) =>
          issue.id === input.issueId ? { ...issue, sprint_id: input.sprintId } : issue,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}
