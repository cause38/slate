import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { cache } from "react";

export type ProjectSummary = Pick<
  Tables<"projects">,
  "id" | "key" | "name" | "color" | "is_archived"
>;

/**
 * 프로젝트 레이아웃이 목록을, 그 아래 페이지가 같은 프로젝트를 다시 조회해서 한 요청에
 * 왕복이 두 번 났다. React.cache 로 요청 단위 캐시를 두고, 단건 조회는 목록에서 찾아 쓴다.
 * 이러면 페이지 쪽 왕복이 아예 사라진다.
 */
export const fetchActiveProjects = cache(async (): Promise<ProjectSummary[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, key, name, color, is_archived")
    .eq("is_archived", false)
    .order("created_at");
  return data ?? [];
});

export const findProjectByKey = cache(
  async (projectKey: string): Promise<ProjectSummary | null> => {
    const projects = await fetchActiveProjects();
    return projects.find((project) => project.key === projectKey) ?? null;
  },
);
