import type { PostgrestError } from "@supabase/supabase-js";

/**
 * PostgREST 는 RLS 에 막힌 행을 "차단"하지 않고 "안 보이게" 한다. 그래서 권한 없는
 * UPDATE·DELETE 는 error 없이 0행으로 조용히 성공한다. 호출부의 onError 가 영영 안 뜨고
 * onSuccess 가 돌아 사용자는 "버튼이 죽었다"고만 느낀다.
 *
 * 쓰기 뒤에 `.select("id")` 를 붙이고 이 함수로 실제 반영 여부를 확인한다.
 */
export function assertWritten(
  result: { error: PostgrestError | null; data: { id: string }[] | null },
  message: string,
): void {
  if (result.error) throw result.error;
  if (!result.data || result.data.length === 0) throw new Error(message);
}
