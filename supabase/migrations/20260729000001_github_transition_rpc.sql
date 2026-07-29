-- W5-1 GitHub 자동 상태 전환 RPC (github-webhook Edge Function이 호출)
--
-- security invoker(기본): 호출자 권한으로 실행한다. Edge Function은 service_role로 호출해
-- RLS를 우회하고, 혹시 authenticated가 호출해도 issues RLS가 그대로 적용돼 권한 상승이 없다.
-- (complete_sprint에서 security definer가 admin RLS를 우회했던 문제를 반복하지 않기 위함)
--
-- 자동 전환은 프로젝트 settings.auto_status_transition이 켜진 경우에만 수행.
-- 조건(상태·자동화 플래그)을 단일 UPDATE에 담아 read-then-write 경합(TOCTOU)을 없애고,
-- row_count로 실제 전환 여부를 boolean으로 돌려 웹훅 핸들러가 로깅할 수 있게 한다.
-- 상태 UPDATE는 trg_issues_change_log가 활동 로그를 남기고(actor=auth.uid()=null → "시스템"),
-- trg_issues_touch가 updated_at을 갱신한다.

-- 반환 타입을 boolean으로 두므로 기존 정의가 있으면 먼저 제거 (create or replace로는 반환형 변경 불가)
drop function if exists transition_if_todo(uuid, text);
drop function if exists transition_if_open(uuid, text);

-- PR opened 등: 이슈가 To Do일 때만 지정 상태로 전환 (보통 in_review). 전환되면 true.
create or replace function transition_if_todo(p_issue_id uuid, p_to text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  update issues i
    set status = p_to
  from projects p
  where i.id = p_issue_id
    and p.id = i.project_id
    and i.status = 'todo'
    and coalesce((p.settings->>'auto_status_transition')::boolean, true);
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- PR merged 등: 이슈가 미완료(To Do/In Progress/In Review)일 때 지정 상태로 전환 (보통 done). 전환되면 true.
create or replace function transition_if_open(p_issue_id uuid, p_to text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  update issues i
    set status = p_to
  from projects p
  where i.id = p_issue_id
    and p.id = i.project_id
    and i.status <> 'done'
    and coalesce((p.settings->>'auto_status_transition')::boolean, true);
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;
