"use client";

import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Sprint = Tables<"sprints">;

/** 스프린트 마감 시 미완료 이슈 처리 방식 */
export type CarryOver = "next" | "backlog" | "keep";

export const sprintKeys = {
  all: ["sprints"] as const,
  byProject: (projectId: string) => [...sprintKeys.all, "project", projectId] as const,
};

export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: sprintKeys.byProject(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async (): Promise<Sprint[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId ?? "")
        .order("start_date");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      start_date: string;
      end_date: string;
      goal: string | null;
    }): Promise<Sprint> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sprints")
        .insert({ project_id: projectId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/** planned → active. 프로젝트당 active 1개 제약은 DB unique 인덱스가 보장 */
export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sprints")
        .update({ status: "active" })
        .eq("id", sprintId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
    },
  });
}

/** active → completed + 미완료 이슈 처리 (complete_sprint RPC) */
export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sprintId: string; carryOver: CarryOver }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.rpc("complete_sprint", {
        p_sprint_id: input.sprintId,
        p_carry_over: input.carryOver,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}
