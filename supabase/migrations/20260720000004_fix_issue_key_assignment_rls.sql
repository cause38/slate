-- 이슈 키 발급 트리거 RLS 버그 수정
-- 문제: fn_assign_issue_key가 호출자 권한으로 실행돼 member의 insert 시
--       projects.issue_counter 증가가 RLS(projects_admin_write)에 막혀 key가 null → insert 실패.
-- 수정: security definer로 카운터 증가만 RLS 우회.
--       security definer에서는 current_user가 함수 소유자로 바뀌므로
--       서버 경로 판별을 auth.role()(PostgREST 요청 role)로 변경.
--       - authenticated/anon 요청 → 항상 트리거 발급 (카운터 우회 차단)
--       - service_role 요청(Jira 마이그레이션) / 직접 DB 연결(시드) → 명시 키 보존 (PRD 4.4)
create or replace function fn_assign_issue_key()
returns trigger
security definer
set search_path = public
as $$
declare
  v_project_key text;
  v_next int;
  v_api_role text := coalesce(auth.role(), 'direct');
begin
  if new.key is not null and new.key <> '' and v_api_role in ('service_role', 'direct') then
    return new;
  end if;

  select key into v_project_key from projects where id = new.project_id;
  -- 카운터 atomic 증가
  update projects
    set issue_counter = issue_counter + 1
    where id = new.project_id
    returning issue_counter into v_next;
  new.key := v_project_key || '-' || v_next;
  return new;
end;
$$ language plpgsql;
