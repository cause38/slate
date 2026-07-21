"use client";

import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Label = Tables<"labels">;

export type LabelWithUsage = Label & { issueCount: number };

// 디자인 핸드오프 3.2 — 에픽/라벨용 8색 팔레트 프리셋
export const LABEL_COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#64748b",
] as const;

export const labelKeys = {
  all: ["labels"] as const,
  byProject: (projectId: string) => [...labelKeys.all, "project", projectId] as const,
};

export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: labelKeys.byProject(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async (): Promise<Label[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .eq("project_id", projectId ?? "")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** 라벨별 부착 이슈 수 포함 — 설정 화면(삭제 영향 표시)용 */
export function useLabelsWithUsage(projectId: string | undefined) {
  return useQuery({
    queryKey: [...labelKeys.byProject(projectId ?? ""), "usage"],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<LabelWithUsage[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("labels")
        .select("*, issue_labels(count)")
        .eq("project_id", projectId ?? "")
        .order("name");
      if (error) throw error;
      return data.map(({ issue_labels, ...label }) => ({
        ...label,
        issueCount: (issue_labels as { count: number }[])[0]?.count ?? 0,
      }));
    },
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color: string }): Promise<Label> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("labels")
        .insert({ project_id: projectId, name: input.name, color: input.color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.byProject(projectId) });
    },
  });
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("labels").delete().eq("id", labelId);
      if (error) throw error;
    },
    onSuccess: () => {
      // byProject prefix로 usage 파생 키까지 함께 무효화
      queryClient.invalidateQueries({ queryKey: labelKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

/** 이슈에 라벨 부착/해제 */
export function useToggleIssueLabel(issueKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      issueId: string;
      labelId: string;
      attached: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      if (input.attached) {
        const { error } = await supabase
          .from("issue_labels")
          .delete()
          .eq("issue_id", input.issueId)
          .eq("label_id", input.labelId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("issue_labels")
          .insert({ issue_id: input.issueId, label_id: input.labelId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueKey) });
    },
  });
}
