export function getSupabaseEnv() {
  // NEXT_PUBLIC_ 변수는 번들 시점 치환이 필요해 정적으로 참조해야 함
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수를 설정해주세요 (.env.example 참고)",
    );
  }

  return { url, anonKey };
}
