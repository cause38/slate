import { getSupabaseEnv } from "@/lib/supabase/env";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
