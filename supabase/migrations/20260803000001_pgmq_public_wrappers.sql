-- W6-1 pgmq 큐 소비용 public 래퍼 RPC
--
-- pgmq.read/pgmq.delete는 pgmq 스키마에 있어 PostgREST(public만 노출)로 직접 호출할 수 없다.
-- slack-notify Edge Function이 service_role로 큐를 소비할 수 있게 public 래퍼를 둔다.
-- security definer로 pgmq 스키마에 접근하되, 실행 권한은 service_role로만 제한해
-- authenticated/anon이 알림 큐를 읽거나 지우지 못하게 한다.

-- pgmq 업그레이드로 반환형(pgmq.message_record)이 바뀌면 create or replace가 깨질 수 있어 선제거
drop function if exists pgmq_read(text, integer, integer);
drop function if exists pgmq_delete(text, bigint);

-- 큐에서 최대 qty개 읽기 (vt초 동안 다른 소비자에게 비가시)
create or replace function pgmq_read(queue_name text, vt integer, qty integer)
returns setof pgmq.message_record
language sql
security definer
set search_path = pgmq, public
as $$
  select * from pgmq.read(queue_name, vt, qty);
$$;

-- 처리 완료된 메시지 삭제
create or replace function pgmq_delete(queue_name text, msg_id bigint)
returns boolean
language sql
security definer
set search_path = pgmq, public
as $$
  select pgmq.delete(queue_name, msg_id);
$$;

-- Supabase는 public 스키마 신규 함수에 anon/authenticated 실행 권한을 기본 부여하므로
-- public뿐 아니라 이 둘도 명시적으로 revoke해야 큐 접근이 service_role로만 제한된다.
revoke all on function pgmq_read(text, integer, integer) from public, anon, authenticated;
revoke all on function pgmq_delete(text, bigint) from public, anon, authenticated;
grant execute on function pgmq_read(text, integer, integer) to service_role;
grant execute on function pgmq_delete(text, bigint) to service_role;
