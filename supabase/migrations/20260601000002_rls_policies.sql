-- Slate RLS 정책 (TDD 3.4)
-- 원칙: 모든 테이블 RLS 활성화 (예외 없음)

alter table users enable row level security;
alter table projects enable row level security;
alter table project_github_repos enable row level security;
alter table sprints enable row level security;
alter table issues enable row level security;
alter table labels enable row level security;
alter table issue_labels enable row level security;
alter table issue_links enable row level security;
alter table comments enable row level security;
alter table attachments enable row level security;
alter table activity_logs enable row level security;
alter table github_links enable row level security;
alter table notifications enable row level security;
alter table slack_workspaces enable row level security;
alter table slack_messages enable row level security;
alter table jira_migration_logs enable row level security;

-- 사용자: 본인은 모든 정보 읽기, 다른 사용자는 공개 정보만
create policy "users_self_all" on users
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users_read_others" on users
  for select to authenticated
  using (true);  -- 5~20명 환경이라 공개

-- Helper: 현재 사용자가 admin인지
create or replace function is_admin()
returns boolean as $$
  select role = 'admin' from users where id = auth.uid();
$$ language sql stable security definer;

-- 프로젝트: 모든 인증된 사용자가 읽기, admin만 변경
create policy "projects_read_all" on projects
  for select to authenticated using (true);

create policy "projects_admin_write" on projects
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- 프로젝트 ↔ GitHub 리포: 읽기 전체, 변경 admin
create policy "project_github_repos_read_all" on project_github_repos
  for select to authenticated using (true);

create policy "project_github_repos_admin_write" on project_github_repos
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- 스프린트: 읽기 전체, 생성/마감은 admin
create policy "sprints_read_all" on sprints
  for select to authenticated using (true);

create policy "sprints_admin_write" on sprints
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- 이슈: 모든 인증 사용자가 읽기/쓰기 (1단계는 권한 단순)
create policy "issues_authenticated_all" on issues
  for all to authenticated
  using (true) with check (true);

-- 라벨: 자유 입력이므로 모든 인증 사용자 읽기/쓰기
create policy "labels_authenticated_all" on labels
  for all to authenticated
  using (true) with check (true);

create policy "issue_labels_authenticated_all" on issue_labels
  for all to authenticated
  using (true) with check (true);

-- 이슈 간 연결: 모든 인증 사용자 읽기/쓰기
create policy "issue_links_authenticated_all" on issue_links
  for all to authenticated
  using (true) with check (true);

-- 코멘트: 본인 것만 수정/삭제, 모두 읽기/생성
create policy "comments_read_all" on comments
  for select to authenticated using (true);

create policy "comments_insert_self" on comments
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "comments_update_self" on comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_delete_self_or_admin" on comments
  for delete to authenticated
  using (author_id = auth.uid() or is_admin());

-- 첨부파일: 읽기 전체, 업로드는 본인 명의, 삭제는 본인 또는 admin
create policy "attachments_read_all" on attachments
  for select to authenticated using (true);

create policy "attachments_insert_self" on attachments
  for insert to authenticated
  with check (uploader_id = auth.uid());

create policy "attachments_delete_self_or_admin" on attachments
  for delete to authenticated
  using (uploader_id = auth.uid() or is_admin());

-- 활동 로그: 읽기 전용 (쓰기는 security definer 트리거가 수행)
create policy "activity_logs_read_all" on activity_logs
  for select to authenticated using (true);

-- GitHub 링크: 읽기 전용 (쓰기는 Edge Function이 service_role로 수행)
create policy "github_links_read_all" on github_links
  for select to authenticated using (true);

-- 알림: 본인 것만
create policy "notifications_self" on notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 슬랙 워크스페이스: admin만
create policy "slack_workspaces_admin" on slack_workspaces
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- 슬랙 발송 기록: admin 읽기 (쓰기는 Edge Function이 service_role로 수행)
create policy "slack_messages_admin_read" on slack_messages
  for select to authenticated using (is_admin());

-- Jira 마이그레이션 로그: admin만 (쓰기는 Edge Function이 service_role로 수행)
create policy "jira_migration_logs_admin_read" on jira_migration_logs
  for select to authenticated using (is_admin());
