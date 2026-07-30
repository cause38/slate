import { type SupabaseClient, createClient } from "jsr:@supabase/supabase-js@2";

/**
 * service_role 클라이언트 — RLS를 우회한다. Edge Function 안에서만 사용.
 * SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY는 Supabase 런타임이 자동 주입한다.
 */
export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
