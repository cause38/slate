-- DB 보안 결정 2건 반영 (TDD v1.3)

-- ① 함수 search_path 고정 — search_path 하이재킹 방지 (Supabase security advisor 권고)
--    함수 본문의 무한정 참조(users, projects, activity_logs)는 public 기준.
--    스키마 한정 참조(auth.uid, pgmq.send)는 영향 없음.
alter function is_admin() set search_path = public;
alter function fn_touch_updated_at() set search_path = public;
alter function fn_issue_change_log() set search_path = public;

-- ② 이슈 키는 트리거가 발급 (클라이언트의 카운터 우회 차단)
--    기존: WHEN (key is null or '') 조건이라 클라이언트가 key를 직접 넣으면 우회 가능.
--    변경: 트리거는 항상 실행하되, service_role(Jira 마이그레이션 등 서버 경로)만
--          명시 키 보존 허용 — PRD 4.4 "이슈 키 보존" 요구사항 유지.
create or replace function fn_assign_issue_key()
returns trigger
set search_path = public
as $$
declare
  v_project_key text;
  v_next int;
begin
  -- 서버 경로(service_role/postgres)는 명시 키 그대로 보존 (지라 이관용)
  if new.key is not null and new.key <> '' and current_user in ('service_role', 'postgres') then
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

drop trigger trg_issues_assign_key on issues;
create trigger trg_issues_assign_key
  before insert on issues
  for each row
  execute function fn_assign_issue_key();
