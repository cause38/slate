-- W3-1 리뷰 P1: complete_sprint 권한 구멍 차단
-- security definer 함수라 sprints_admin_write RLS를 우회 → authenticated 멤버 누구나
-- rpc로 임의 스프린트를 마감할 수 있었다. 함수 시작부에 is_admin() 검사를 추가.
-- (useStartSprint는 평범한 update라 이미 admin RLS로 막히므로 방어를 대칭화)
-- 리뷰 P3: next인데 planned 스프린트가 없으면 백로그(null)로 폴백해 "다음으로 이동"
-- 의도와 결과가 일치하게 한다 (v_next_sprint가 null이면 update가 sprint_id=null로 설정).
create or replace function complete_sprint(p_sprint_id uuid, p_carry_over text)
returns void
security definer
set search_path = public
as $$
declare
  v_next_sprint uuid;
  v_project uuid;
begin
  if not is_admin() then
    raise exception '스프린트 마감은 admin만 할 수 있습니다';
  end if;

  select project_id into v_project from sprints where id = p_sprint_id;

  if p_carry_over = 'next' then
    select id into v_next_sprint from sprints
      where project_id = v_project and status = 'planned'
      order by start_date limit 1;
    -- v_next_sprint가 null이면 백로그로 폴백
    update issues set sprint_id = v_next_sprint
      where sprint_id = p_sprint_id and status <> 'done';
  elsif p_carry_over = 'backlog' then
    update issues set sprint_id = null
      where sprint_id = p_sprint_id and status <> 'done';
  end if;
  -- 'keep'은 미완료 이슈를 완료 스프린트에 그대로 남긴다.

  update sprints set status = 'completed', closed_at = now() where id = p_sprint_id;
end;
$$ language plpgsql;
