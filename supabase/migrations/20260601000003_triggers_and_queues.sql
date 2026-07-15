-- Slate 트리거 & 큐 (TDD 3.3)

-- pgmq 큐 생성
select pgmq.create('slack_notify_queue');

-- 이슈 키 자동 발급 함수
create or replace function fn_assign_issue_key()
returns trigger as $$
declare
  v_project_key text;
  v_next int;
begin
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

create trigger trg_issues_assign_key
  before insert on issues
  for each row
  when (new.key is null or new.key = '')
  execute function fn_assign_issue_key();

-- updated_at 자동 갱신
create or replace function fn_touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_issues_touch
  before update on issues
  for each row
  execute function fn_touch_updated_at();

-- 변경 → 활동 로그 + Slack 큐
create or replace function fn_issue_change_log()
returns trigger as $$
declare
  v_actor uuid := auth.uid();
  v_event text;
begin
  if TG_OP = 'INSERT' then
    v_event := 'created';
    insert into activity_logs (issue_id, actor_id, action, new_value)
      values (new.id, v_actor, v_event,
              jsonb_build_object('title', new.title, 'type', new.type));
    perform pgmq.send('slack_notify_queue',
      jsonb_build_object('issue_id', new.id, 'event', v_event, 'actor', v_actor));
  elsif TG_OP = 'UPDATE' then
    -- 상태 변경
    if old.status is distinct from new.status then
      insert into activity_logs (issue_id, actor_id, action, field, old_value, new_value)
        values (new.id, v_actor, 'status_changed', 'status',
                to_jsonb(old.status), to_jsonb(new.status));
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'status_changed',
                           'old', old.status, 'new', new.status, 'actor', v_actor));
    end if;
    -- 담당자 변경
    if old.assignee_id is distinct from new.assignee_id then
      insert into activity_logs (issue_id, actor_id, action, field, old_value, new_value)
        values (new.id, v_actor, 'assignee_changed', 'assignee_id',
                to_jsonb(old.assignee_id), to_jsonb(new.assignee_id));
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'assignee_changed',
                           'old', old.assignee_id, 'new', new.assignee_id, 'actor', v_actor));
    end if;
    -- 스프린트 이동
    if old.sprint_id is distinct from new.sprint_id then
      insert into activity_logs (issue_id, actor_id, action, field, old_value, new_value)
        values (new.id, v_actor, 'sprint_changed', 'sprint_id',
                to_jsonb(old.sprint_id), to_jsonb(new.sprint_id));
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'sprint_changed',
                           'old', old.sprint_id, 'new', new.sprint_id, 'actor', v_actor));
    end if;
    -- 에픽 변경
    if old.epic_id is distinct from new.epic_id then
      insert into activity_logs (issue_id, actor_id, action, field, old_value, new_value)
        values (new.id, v_actor, 'epic_changed', 'epic_id',
                to_jsonb(old.epic_id), to_jsonb(new.epic_id));
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'epic_changed',
                           'old', old.epic_id, 'new', new.epic_id, 'actor', v_actor));
    end if;
    -- 우선순위 변경
    if old.priority is distinct from new.priority then
      insert into activity_logs (issue_id, actor_id, action, field, old_value, new_value)
        values (new.id, v_actor, 'priority_changed', 'priority',
                to_jsonb(old.priority), to_jsonb(new.priority));
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'priority_changed',
                           'old', old.priority, 'new', new.priority, 'actor', v_actor));
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_issues_change_log
  after insert or update on issues
  for each row execute function fn_issue_change_log();

-- pg_cron으로 Slack 큐 처리 (1분마다)
-- ⚠️ W6(슬랙 알림 Edge Function 배포) 시점에 활성화.
--    사전 조건: pg_cron·pg_net 확장 + app.edge_functions_url / app.service_role_key 설정.
-- select cron.schedule('process-slack-queue', '* * * * *', $$
--   select net.http_post(
--     url := current_setting('app.edge_functions_url') || '/slack-notify',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
--   );
-- $$);
