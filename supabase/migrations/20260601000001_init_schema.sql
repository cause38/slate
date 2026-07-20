-- Slate 초기 스키마 (TDD 3.2)

-- 확장
create extension if not exists pgmq cascade;

-- 사용자 (Supabase auth.users 참조)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 프로젝트
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[A-Z][A-Z0-9]{1,4}$'),
  name text not null,
  color text not null default '#6366f1',
  icon text,
  settings jsonb not null default '{
    "auto_sprint": true,
    "auto_status_transition": true
  }'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  -- 이슈 키 카운터 (DOTOLI-42의 42)
  issue_counter int not null default 0
);

create index idx_projects_active on projects(is_archived) where is_archived = false;

-- 프로젝트 ↔ GitHub 리포 (다대다)
create table public.project_github_repos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  repo_full_name text not null,  -- "bbodek/slate"
  installation_id bigint,
  created_at timestamptz not null default now(),
  unique(project_id, repo_full_name)
);

-- 스프린트
create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  goal text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index idx_sprints_project_status on sprints(project_id, status);

-- 한 프로젝트당 active 스프린트 1개만
create unique index idx_sprints_one_active
  on sprints(project_id) where status = 'active';

-- 이슈
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  key text not null,  -- "DOTOLI-42"
  title text not null,
  body_markdown text not null default '',
  type text not null default 'task' check (type in ('story', 'task', 'bug', 'epic')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'medium' check (priority in ('highest', 'high', 'medium', 'low', 'lowest')),
  assignee_id uuid references users(id) on delete set null,
  reporter_id uuid not null references users(id),
  epic_id uuid references issues(id) on delete set null,  -- self FK
  sprint_id uuid references sprints(id) on delete set null,
  story_points int check (story_points >= 0),
  due_date date,
  -- 정렬용 (백로그/보드에서 드래그 순서)
  rank text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(project_id, key)
);

create index idx_issues_project on issues(project_id);
create index idx_issues_sprint_status on issues(sprint_id, status);
create index idx_issues_assignee on issues(assignee_id) where assignee_id is not null;
create index idx_issues_epic on issues(epic_id) where epic_id is not null;
create index idx_issues_search on issues using gin(to_tsvector('simple', title || ' ' || body_markdown));

-- 라벨
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text not null default '#94a3b8',
  unique(project_id, name)
);

create table public.issue_labels (
  issue_id uuid not null references issues(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

-- 이슈 간 연결
create table public.issue_links (
  id uuid primary key default gen_random_uuid(),
  source_issue_id uuid not null references issues(id) on delete cascade,
  target_issue_id uuid not null references issues(id) on delete cascade,
  link_type text not null check (link_type in ('relates', 'blocks', 'blocked_by', 'duplicates')),
  created_at timestamptz not null default now(),
  check (source_issue_id <> target_issue_id),
  unique(source_issue_id, target_issue_id, link_type)
);

-- 코멘트
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  author_id uuid not null references users(id),
  body_markdown text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index idx_comments_issue on comments(issue_id, created_at);

-- 첨부파일 (S3에 실제 파일)
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  uploader_id uuid not null references users(id),
  filename text not null,
  s3_key text not null,
  size bigint not null,
  mime_type text,
  created_at timestamptz not null default now()
);

-- 활동 로그
create table public.activity_logs (
  id bigserial primary key,
  issue_id uuid not null references issues(id) on delete cascade,
  actor_id uuid references users(id),
  action text not null,  -- 'created', 'status_changed', 'assignee_changed', 'commented', ...
  field text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_issue on activity_logs(issue_id, created_at desc);

-- GitHub 링크 (커밋/PR)
create table public.github_links (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  kind text not null check (kind in ('commit', 'pr')),
  external_id text not null,  -- PR 번호 또는 commit SHA
  url text not null,
  title text,
  state text,  -- open, closed, merged
  author text,
  created_at timestamptz not null default now(),
  unique(issue_id, kind, external_id)
);

create index idx_github_links_issue on github_links(issue_id);

-- 알림
create table public.notifications (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on notifications(user_id, created_at desc)
  where read_at is null;

-- Slack 워크스페이스
create table public.slack_workspaces (
  id uuid primary key default gen_random_uuid(),
  team_id text not null unique,
  team_name text not null,
  bot_token text not null,  -- Supabase Vault로 암호화 (애플리케이션 레이어)
  default_channel_id text not null,  -- 모든 알림이 가는 통합 채널
  installed_by_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- Slack 발송 메시지 추적 (1단계는 스레딩 안 쓰지만 자리 잡아둠)
create table public.slack_messages (
  id bigserial primary key,
  issue_id uuid not null references issues(id) on delete cascade,
  channel_id text not null,
  slack_ts text not null,
  event_type text not null,
  sent_at timestamptz not null default now()
);

-- Jira 마이그레이션 로그 (1회성)
create table public.jira_migration_logs (
  id bigserial primary key,
  jira_issue_key text not null,
  new_issue_id uuid references issues(id),
  status text not null check (status in ('ok', 'warn', 'fail')),
  notes text,
  migrated_at timestamptz not null default now()
);
