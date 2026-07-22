import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionUser = {
  id: string;
  role: Database["public"]["Tables"]["users"]["Row"]["role"];
};

/** 서버에서 현재 로그인 사용자의 id·role을 1회 조회 (getUser 중복 왕복 방지) */
export async function getSessionUser(
  supabase: SupabaseClient<Database>,
): Promise<SessionUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return { id: user.id, role: data?.role ?? "member" };
}

/** 서버 컴포넌트에서 현재 로그인 사용자가 admin인지 판별 (RLS와 별개 UI 게이팅용) */
export async function isCurrentUserAdmin(supabase: SupabaseClient<Database>): Promise<boolean> {
  const sessionUser = await getSessionUser(supabase);
  return sessionUser?.role === "admin";
}
