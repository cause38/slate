// 서버 컴포넌트와 클라이언트 훅이 공유하는 이슈 쿼리 정의.
// "use client" 금지 — 양쪽에서 import되므로 중립 모듈로 유지할 것.
import type { Database, Tables } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Issue = Tables<"issues">;

export type IssueWithProject = Issue & {
  project: Pick<Tables<"projects">, "key" | "color"> | null;
};

const MY_ISSUES_SELECT = "*, project:projects(key, color)";
const MY_ISSUES_LIMIT = 20;

/** 홈 "내 담당 이슈" — 미완료만, 최근 수정 순 */
export async function fetchMyIssues(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<IssueWithProject[]> {
  const { data, error } = await supabase
    .from("issues")
    .select(MY_ISSUES_SELECT)
    .eq("assignee_id", userId)
    .neq("status", "done")
    .order("updated_at", { ascending: false })
    .limit(MY_ISSUES_LIMIT);
  if (error) throw error;
  return data;
}
