-- W3-1 스프린트 운영 RPC (TDD 5.3)
-- 스프린트 마감: active → completed, 미완료 이슈 처리 (next/backlog/keep)
create or replace function complete_sprint(p_sprint_id uuid, p_carry_over text)
returns void
security definer
set search_path = public
as $$
declare
  v_next_sprint uuid;
  v_project uuid;
begin
  select project_id into v_project from sprints where id = p_sprint_id;

  if p_carry_over = 'next' then
    -- 가장 가까운 planned 스프린트로 이동 (없으면 그대로 둠)
    select id into v_next_sprint from sprints
      where project_id = v_project and status = 'planned'
      order by start_date limit 1;
    if v_next_sprint is not null then
      update issues set sprint_id = v_next_sprint
        where sprint_id = p_sprint_id and status <> 'done';
    end if;
  elsif p_carry_over = 'backlog' then
    update issues set sprint_id = null
      where sprint_id = p_sprint_id and status <> 'done';
  end if;
  -- 'keep'은 미완료 이슈를 그대로 완료 스프린트에 남긴다.

  update sprints set status = 'completed', closed_at = now() where id = p_sprint_id;
end;
$$ language plpgsql;
