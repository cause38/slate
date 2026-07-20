"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useQuery } from "@tanstack/react-query";

export type Project = Tables<"projects">;

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("is_archived", false)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}
