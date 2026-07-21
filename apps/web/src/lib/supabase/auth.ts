import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 서버 컴포넌트에서 현재 로그인 사용자가 admin인지 판별 (RLS와 별개 UI 게이팅용) */
export async function isCurrentUserAdmin(supabase: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}
