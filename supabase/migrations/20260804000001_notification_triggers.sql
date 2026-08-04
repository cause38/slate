-- W7-2a 인앱 알림 생성 트리거
--
-- security definer: 트리거가 '다른 사용자'의 notifications 행을 insert해야 하므로 RLS 우회 필요
-- (notifications_self의 with check는 본인 행만 허용 → 호출자 권한으론 타인 알림 생성 불가).
-- trigger 반환형이라 PostgREST/SELECT 직접 호출은 불가능(권한 상승 표면 없음, revoke 불필요).
-- 본인이 일으킨 변경은 자기 알림에서 제외. actor가 null(system, 예: GitHub 웹훅 자동 전환)이면 알림 생성.
-- payload에 issue_key/title을 담아 프론트가 추가 조인 없이 렌더한다.
-- type: 'assigned' | 'status_changed' | 'commented'  (issue 이벤트의 actor는 null 가능 — 프론트에서 '시스템' 처리)

create or replace function fn_issue_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_assignee_changed boolean;
begin
  -- 담당자 알림: 생성 시 배정(INSERT) 또는 담당자 변경(UPDATE). 본인(actor) 배정은 제외.
  if tg_op = 'INSERT' then
    v_assignee_changed := new.assignee_id is not null;
  else
    v_assignee_changed := new.assignee_id is distinct from old.assignee_id and new.assignee_id is not null;
  end if;

  if v_assignee_changed and (v_actor is null or new.assignee_id <> v_actor) then
    insert into notifications (user_id, type, payload)
    values (
      new.assignee_id, 'assigned',
      jsonb_build_object('issue_id', new.id, 'issue_key', new.key, 'issue_title', new.title, 'actor', v_actor)
    );
  end if;

  -- 상태 변경 알림: UPDATE에서 status가 바뀌고 보고자가 본인(actor)이 아닐 때 (생성은 상태변경 아님)
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and (v_actor is null or new.reporter_id <> v_actor) then
    insert into notifications (user_id, type, payload)
    values (
      new.reporter_id, 'status_changed',
      jsonb_build_object('issue_id', new.id, 'issue_key', new.key, 'issue_title', new.title,
                         'old', old.status, 'new', new.status, 'actor', v_actor)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_issues_notifications on issues;
create trigger trg_issues_notifications
  after insert or update on issues
  for each row execute function fn_issue_notifications();

-- 코멘트: 이슈의 보고자·담당자에게 알림 (코멘트 작성자 본인 제외, 보고자=담당자면 1건)
create or replace function fn_comment_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue record;
begin
  select reporter_id, assignee_id, key, title into v_issue from issues where id = new.issue_id;

  if v_issue.reporter_id is not null and v_issue.reporter_id <> new.author_id then
    insert into notifications (user_id, type, payload)
    values (
      v_issue.reporter_id, 'commented',
      jsonb_build_object('issue_id', new.issue_id, 'issue_key', v_issue.key, 'issue_title', v_issue.title,
                         'comment_id', new.id, 'actor', new.author_id)
    );
  end if;

  if v_issue.assignee_id is not null
     and v_issue.assignee_id <> new.author_id
     and v_issue.assignee_id is distinct from v_issue.reporter_id then
    insert into notifications (user_id, type, payload)
    values (
      v_issue.assignee_id, 'commented',
      jsonb_build_object('issue_id', new.issue_id, 'issue_key', v_issue.key, 'issue_title', v_issue.title,
                         'comment_id', new.id, 'actor', new.author_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_comments_notifications on comments;
create trigger trg_comments_notifications
  after insert on comments
  for each row execute function fn_comment_notifications();
