# Slate — 기술 설계서 (Technical Design Document)

> PRD v1.0의 모든 결정을 코드 설계로 풀어쓴 문서. 개발 착수 시점의 단일 참조 문서.

| 항목 | 내용 |
|---|---|
| 도구 이름 | **Slate** |
| 참조 PRD | `PRD_사내_이슈트래커.md` v1.0 |
| 작성자 | 진주 (jj.park@bbodek.com) |
| 작성일 | 2026-06 |
| 문서 상태 | v1.1 |
| 대상 독자 | 1단계 개발자 (프론트엔드/백엔드 통합 개발) |

---

## 1. 기술 스택

### 1.1 선정 결과

| 영역 | 선택 | 근거 |
|---|---|---|
| 프론트엔드 프레임워크 | **Next.js 15 (App Router)** | Supabase 공식 지원, 2단계 공개 호스팅 시 Vercel 무중단 이전, OG 메타 태그용 SSR 내장 |
| 언어 | **TypeScript** | DB 스키마에서 타입 자동 생성, 런타임 오류 사전 차단 |
| UI 라이브러리 | **Tailwind CSS + shadcn/ui** | Radix 기반 접근성, 커스터마이징 쉬움 |
| 상태 관리 | **TanStack Query (서버 상태) + Zustand (UI 상태)** | Supabase realtime과 잘 맞음, 보일러플레이트 적음 |
| 드래그&드롭 | **dnd-kit** | 보드 카드 이동, 백로그 순서 변경. React 친화적 |
| 마크다운 | **react-markdown + remark-gfm** | 이슈 본문/코멘트 렌더링, GitHub Flavored Markdown |
| 차트 | **Recharts** | 벨로시티 막대그래프, 가벼움 |
| 폼 | **React Hook Form + Zod** | 검증 + 타입 안정성 |
| 백엔드 | **Supabase Cloud** | Postgres + Auth + Storage + Realtime + Edge Functions 통합 |
| DB | **Postgres 15+** (Supabase 기본) | |
| Edge Function 런타임 | **Deno** (Supabase 기본) | |
| 첨부파일 | **AWS S3** | 사내 기존 자산, presigned URL 방식 |
| 패키지 매니저 | **pnpm** | 모노레포 효율, 디스크 절약 |
| 코드 포맷 | **Biome** (lint + format) | ESLint+Prettier보다 빠르고 단일 도구 |
| 테스트 | **Vitest** (단위) + **Playwright** (E2E) | |

### 1.2 의도적으로 안 쓰는 것

- **별도 ORM (Prisma/Drizzle)** — Supabase 자동 생성 TypeScript 타입 + Supabase 클라이언트 쿼리 빌더로 충분. 별도 ORM은 마이그레이션 시 충돌 위험.
- **별도 백엔드 서버 (Express/Nest 등)** — Supabase Cloud로 일원화. 추가 로직은 Postgres 함수 + Edge Function.
- **GraphQL** — 1단계 규모에선 과함. Supabase PostgREST + RPC로 충분.
- **상태관리 over-engineering** — Redux/Recoil 대신 TanStack Query + Zustand로 최소화.

---

## 2. 시스템 아키텍처

### 2.1 전체 구성도

```
┌────────────────────────────────────────────────────────────────┐
│                          사용자 브라우저                          │
│                                                                │
│    Next.js (로컬 또는 사내 서버, Docker Compose)                  │
│    ├─ App Router (SSR/CSR 혼합)                                  │
│    ├─ Supabase Client (anon key + 세션 토큰)                     │
│    └─ Realtime Subscriptions (보드 라이브 업데이트)               │
└──────────────┬─────────────────────────────────────────────────┘
               │ HTTPS
               ▼
┌────────────────────────────────────────────────────────────────┐
│                       Supabase Cloud (ap-northeast-2)            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  PostgREST   │  │  Auth (GoTrue)│  │  Realtime    │           │
│  │  (자동 REST) │  │  Google OAuth │  │  (WebSocket) │           │
│  └──────┬───────┘  └───────┬──────┘  └──────┬───────┘           │
│         │                  │                 │                   │
│         ▼                  ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Postgres 15 (RLS 적용)              │            │
│  │  - issues, sprints, projects, comments, ...      │            │
│  │  - Triggers → pgmq 큐 → Edge Function            │            │
│  └─────────────────────────────────────────────────┘            │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Edge Functions (Deno)                │           │
│  │  - github-webhook  (인바운드: GitHub → DB)        │           │
│  │  - slack-notify    (아웃바운드: DB → Slack)       │           │
│  │  - jira-import     (관리자 트리거: Jira → DB)     │           │
│  │  - s3-presign      (S3 업/다운 URL 발급)          │           │
│  └──────────────────────────────────────────────────┘           │
└─────────┬────────────────────────────────┬────────────────────┘
          │                                │
          ▼                                ▼
   ┌────────────┐                  ┌───────────────┐
   │   GitHub   │                  │     Slack     │
   │  (Webhook) │                  │  (Bot Slate)  │
   └────────────┘                  └───────────────┘

          AWS S3 (첨부파일) ◄─── presigned URL로 브라우저가 직접 업/다운로드
```

### 2.2 데이터 흐름 (주요 시나리오)

**A. 이슈 생성 → 슬랙 알림**
1. 사용자가 "이슈 생성" → `INSERT INTO issues` (PostgREST 통해)
2. Postgres 트리거가 `notifications` 큐(pgmq)에 작업 enqueue
3. Edge Function `slack-notify`가 큐를 폴링 (또는 pg_net으로 즉시 호출)
4. Slack Web API 호출 → `#slate-alerts` 채널에 메시지 발송
5. Realtime이 다른 클라이언트의 보드에 새 카드 push

**B. GitHub PR 머지 → 이슈 자동 Done**
1. GitHub Webhook → `https://<project>.supabase.co/functions/v1/github-webhook`
2. Edge Function이 서명 검증 → 페이로드에서 `DOTOLI-\d+` 패턴 추출
3. `UPDATE issues SET status = 'done'` (자동화 룰이 켜진 프로젝트만)
4. 트리거가 활동 로그 + 슬랙 알림 큐 enqueue
5. 사용자 보드에 Realtime으로 상태 변경 반영

**C. 첨부파일 업로드**
1. 사용자가 파일 선택 → 브라우저가 Edge Function `s3-presign` 호출
2. Edge Function이 STS로 presigned PUT URL 생성 → 브라우저 반환
3. 브라우저가 S3에 직접 PUT (Supabase를 통과하지 않음 = 비용/속도 ↑)
4. 업로드 완료 후 `INSERT INTO attachments` (URL, 크기, 이름 기록)

---

## 3. 데이터 스키마 (SQL)

### 3.1 마이그레이션 파일 구조

```
supabase/
├── migrations/
│   ├── 20260601000001_init_schema.sql
│   ├── 20260601000002_rls_policies.sql
│   ├── 20260601000003_triggers_and_queues.sql
│   └── 20260601000004_seed_dotoli.sql
└── config.toml
```

### 3.2 초기 스키마 (`init_schema.sql`)

```sql
-- 확장
create extension if not exists "uuid-ossp";
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  repo_full_name text not null,  -- "bbodek/slate"
  installation_id bigint,
  created_at timestamptz not null default now(),
  unique(project_id, repo_full_name)
);

-- 스프린트
create table public.sprints (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  source_issue_id uuid not null references issues(id) on delete cascade,
  target_issue_id uuid not null references issues(id) on delete cascade,
  link_type text not null check (link_type in ('relates', 'blocks', 'blocked_by', 'duplicates')),
  created_at timestamptz not null default now(),
  check (source_issue_id <> target_issue_id),
  unique(source_issue_id, target_issue_id, link_type)
);

-- 코멘트
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid not null references issues(id) on delete cascade,
  author_id uuid not null references users(id),
  body_markdown text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index idx_comments_issue on comments(issue_id, created_at);

-- 첨부파일 (S3에 실제 파일)
create table public.attachments (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
```

### 3.3 트리거 & 큐 (`triggers_and_queues.sql`)

```sql
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
      perform pgmq.send('slack_notify_queue',
        jsonb_build_object('issue_id', new.id, 'event', 'sprint_changed',
                           'old', old.sprint_id, 'new', new.sprint_id, 'actor', v_actor));
    end if;
    -- ... epic, priority 등 같은 패턴
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_issues_change_log
  after insert or update on issues
  for each row execute function fn_issue_change_log();

-- pg_cron으로 Slack 큐 처리 (1분마다)
select cron.schedule('process-slack-queue', '* * * * *', $$
  select net.http_post(
    url := current_setting('app.edge_functions_url') || '/slack-notify',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  );
$$);
```

### 3.4 RLS 정책 (`rls_policies.sql`)

```sql
-- RLS 활성화
alter table users enable row level security;
alter table projects enable row level security;
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

-- 이슈: 모든 인증 사용자가 읽기/쓰기 (1단계는 권한 단순)
create policy "issues_authenticated_all" on issues
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

-- 알림: 본인 것만
create policy "notifications_self" on notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 슬랙 워크스페이스: admin만
create policy "slack_workspaces_admin" on slack_workspaces
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- 나머지 테이블도 비슷한 패턴 (생략)
```

### 3.5 시드 데이터 (`seed_dotoli.sql`)

```sql
insert into projects (key, name, color)
  values ('DOTOLI', '도토리 프로젝트 (시드)', '#a16207');

-- 라벨 예시
insert into labels (project_id, name, color) values
  ((select id from projects where key = 'DOTOLI'), 'bug', '#ef4444'),
  ((select id from projects where key = 'DOTOLI'), 'frontend', '#3b82f6'),
  ((select id from projects where key = 'DOTOLI'), 'backend', '#10b981');
```

---

## 4. Edge Functions

### 4.1 폴더 구조

```
supabase/functions/
├── _shared/
│   ├── supabase.ts        # service-role 클라이언트 생성 헬퍼
│   ├── slack.ts           # Slack Web API 래퍼
│   └── jira.ts            # Jira REST 래퍼
├── github-webhook/
│   ├── index.ts
│   └── deno.json
├── slack-notify/
│   ├── index.ts
│   └── deno.json
├── s3-presign/
│   └── index.ts
├── jira-import/
│   └── index.ts
└── import_map.json
```

### 4.2 `github-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const ISSUE_KEY_RE = /\b([A-Z][A-Z0-9]{1,4})-(\d+)\b/g;

serve(async (req) => {
  // 1. GitHub 서명 검증
  const signature = req.headers.get("x-hub-signature-256");
  const body = await req.text();
  if (!verifySignature(body, signature, Deno.env.get("GITHUB_WEBHOOK_SECRET")!)) {
    return new Response("invalid signature", { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(body);
  const supabase = createServiceClient();

  // 2. 이벤트별 처리
  if (event === "pull_request") {
    const pr = payload.pull_request;
    const action = payload.action; // opened, closed, edited, ...
    const keys = extractIssueKeys(pr.title + " " + (pr.body ?? "") + " " + pr.head.ref);

    for (const key of keys) {
      // 2-1. github_links upsert
      const issueId = await findIssueIdByKey(supabase, key);
      if (!issueId) continue;

      await supabase.from("github_links").upsert({
        issue_id: issueId,
        kind: "pr",
        external_id: String(pr.number),
        url: pr.html_url,
        title: pr.title,
        state: pr.merged ? "merged" : pr.state,
        author: pr.user.login,
      });

      // 2-2. 자동 상태 전환
      if (action === "opened") {
        await supabase.rpc("transition_if_todo", { p_issue_id: issueId, p_to: "in_review" });
      } else if (pr.merged) {
        await supabase.rpc("transition_if_open", { p_issue_id: issueId, p_to: "done" });
      }
    }
  } else if (event === "push") {
    // 커밋 메시지에서 이슈 키 추출 → github_links 추가
    for (const commit of payload.commits) {
      const keys = extractIssueKeys(commit.message);
      for (const key of keys) {
        const issueId = await findIssueIdByKey(supabase, key);
        if (!issueId) continue;
        await supabase.from("github_links").upsert({
          issue_id: issueId,
          kind: "commit",
          external_id: commit.id,
          url: commit.url,
          title: commit.message.split("\n")[0],
          author: commit.author.username ?? commit.author.name,
        });
      }
    }
  }

  return new Response("ok");
});

function extractIssueKeys(text: string): string[] {
  return [...new Set([...text.matchAll(ISSUE_KEY_RE)].map((m) => m[0]))];
}

async function findIssueIdByKey(supabase: any, key: string) {
  const { data } = await supabase.from("issues").select("id").eq("key", key).maybeSingle();
  return data?.id;
}

function verifySignature(body: string, signature: string | null, secret: string) {
  // HMAC SHA-256 검증 (생략 — Deno std crypto)
}
```

### 4.3 `slack-notify/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { postMessage, buildBlocks } from "../_shared/slack.ts";

serve(async (req) => {
  // pg_cron이 1분마다 호출
  const supabase = createServiceClient();

  // 1. 큐에서 최대 50개 꺼냄
  const { data: messages } = await supabase.rpc("pgmq_read", {
    queue_name: "slack_notify_queue",
    vt: 30,   // 30초 가시성 타임아웃
    qty: 50,
  });

  if (!messages?.length) return new Response("empty");

  // 2. Workspace 정보 (1개만 가정)
  const { data: ws } = await supabase.from("slack_workspaces").select("*").single();
  if (!ws) return new Response("no workspace");

  // 3. 각 메시지 처리
  for (const msg of messages) {
    try {
      const event = msg.message;
      const { data: issue } = await supabase.from("issues").select("*, project:projects(key, name)").eq("id", event.issue_id).single();
      const blocks = buildBlocks(issue, event);

      const resp = await postMessage({
        token: ws.bot_token,
        channel: ws.default_channel_id,
        blocks,
        text: `[${issue.key}] ${issue.title}`,
      });

      // 4. 발송 기록
      await supabase.from("slack_messages").insert({
        issue_id: issue.id,
        channel_id: ws.default_channel_id,
        slack_ts: resp.ts,
        event_type: event.event,
      });

      // 5. 큐에서 archive
      await supabase.rpc("pgmq_delete", { queue_name: "slack_notify_queue", msg_id: msg.msg_id });
    } catch (e) {
      console.error("slack-notify error", e);
      // visibility timeout 끝나면 재시도
    }
  }

  return new Response(`processed ${messages.length}`);
});
```

### 4.4 `s3-presign/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { S3Client, getSignedUrl, PutObjectCommand, GetObjectCommand } from "...";

serve(async (req) => {
  const { action, filename, mime_type, s3_key } = await req.json();
  // 사용자 인증 확인 (JWT 검증)
  // ...

  const s3 = new S3Client({ region: "ap-northeast-2", credentials: {...} });

  if (action === "upload") {
    const key = `slate/${crypto.randomUUID()}/${filename}`;
    const url = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: Deno.env.get("S3_BUCKET")!,
      Key: key,
      ContentType: mime_type,
    }), { expiresIn: 3600 });
    return Response.json({ url, s3_key: key });
  }

  if (action === "download") {
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: Deno.env.get("S3_BUCKET")!,
      Key: s3_key,
    }), { expiresIn: 3600 });
    return Response.json({ url });
  }
});
```

### 4.5 `jira-import/index.ts` (관리자 트리거)

```typescript
// admin이 설정 화면에서 "Jira 가져오기" 클릭 시 호출
// 1. Jira REST로 프로젝트 + 이슈 조회 (JQL)
// 2. 각 이슈를 issues 테이블에 insert (key는 보존)
// 3. 코멘트/라벨/첨부 순차 처리
// 4. jira_migration_logs에 결과 기록
// Phase A/B/C/D 중 어느 단계인지 파라미터로 받음
```

---

## 5. API 표면 (프론트엔드 ↔ Supabase)

### 5.1 Supabase Client 사용 패턴

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
// 서버 컴포넌트 / Route Handler용
```

### 5.2 주요 쿼리 예시

```typescript
// 보드: Active 스프린트의 이슈
const { data } = await supabase
  .from("issues")
  .select(`
    *,
    assignee:users!assignee_id(id, name, avatar_url),
    epic:issues!epic_id(id, key, title),
    labels:issue_labels(label:labels(name, color))
  `)
  .eq("sprint_id", activeSprintId)
  .order("rank");

// 이슈 생성 (키는 트리거가 자동 발급)
const { data, error } = await supabase.from("issues").insert({
  project_id,
  title,
  type: "task",
  reporter_id: user.id,
}).select().single();

// Realtime: 보드 라이브 업데이트
supabase.channel(`board:${sprintId}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "issues", filter: `sprint_id=eq.${sprintId}` },
      (payload) => queryClient.invalidateQueries({ queryKey: ["board", sprintId] }))
  .subscribe();
```

### 5.3 커스텀 RPC (복잡한 작업)

```sql
-- 상태 강제 전환 (자동화 룰용)
create function transition_if_todo(p_issue_id uuid, p_to text)
returns void as $$
  update issues set status = p_to
   where id = p_issue_id and status = 'todo';
$$ language sql security definer;

create function transition_if_open(p_issue_id uuid, p_to text)
returns void as $$
  update issues set status = p_to
   where id = p_issue_id and status in ('todo', 'in_progress', 'in_review');
$$ language sql security definer;

-- 스프린트 마감 (active → completed, 미완료 이슈 처리)
create function complete_sprint(p_sprint_id uuid, p_carry_over text)
returns void as $$
declare
  v_next_sprint uuid;
begin
  if p_carry_over = 'next' then
    select id into v_next_sprint from sprints
      where project_id = (select project_id from sprints where id = p_sprint_id)
        and status = 'planned'
      order by start_date limit 1;
    update issues set sprint_id = v_next_sprint
      where sprint_id = p_sprint_id and status <> 'done';
  elsif p_carry_over = 'backlog' then
    update issues set sprint_id = null
      where sprint_id = p_sprint_id and status <> 'done';
  end if;
  update sprints set status = 'completed', closed_at = now() where id = p_sprint_id;
end;
$$ language plpgsql security definer;

-- 벨로시티 (최근 5개 스프린트)
create function project_velocity(p_project_id uuid)
returns table(sprint_name text, completed_points int) as $$
  select s.name, coalesce(sum(i.story_points), 0)::int
    from sprints s
    left join issues i on i.sprint_id = s.id and i.status = 'done'
    where s.project_id = p_project_id and s.status = 'completed'
    group by s.id, s.name, s.end_date
    order by s.end_date desc
    limit 5;
$$ language sql stable;
```

---

## 6. 프론트엔드 폴더 구조

```
apps/web/
├── public/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 글로벌 레이아웃 (사이드바)
│   │   ├── page.tsx            # / → 프로젝트 스위처 / 홈
│   │   ├── login/page.tsx
│   │   ├── projects/
│   │   │   └── [projectKey]/
│   │   │       ├── layout.tsx  # 프로젝트 컨텍스트
│   │   │       ├── board/page.tsx
│   │   │       ├── backlog/page.tsx
│   │   │       ├── epics/page.tsx
│   │   │       └── reports/page.tsx
│   │   ├── i/[issueKey]/page.tsx  # 이슈 상세 (전역 URL)
│   │   ├── settings/
│   │   │   ├── workspace/page.tsx  # Admin
│   │   │   ├── project/[projectKey]/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/                # Next.js Route Handler (필요시)
│   │       └── og/[issueKey]/route.ts  # 2단계: 동적 OG 이미지
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── board/
│   │   │   ├── Board.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   └── useBoardDnd.ts
│   │   ├── issue/
│   │   │   ├── IssueDetail.tsx
│   │   │   ├── IssueMeta.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   └── GithubLinks.tsx
│   │   ├── sprint/
│   │   │   ├── SprintSelector.tsx
│   │   │   ├── SprintReport.tsx
│   │   │   └── VelocityChart.tsx
│   │   ├── search/
│   │   │   └── GlobalSearch.tsx     # Cmd+K
│   │   └── shared/
│   │       ├── ProjectSwitcher.tsx
│   │       ├── NotificationBell.tsx
│   │       └── QuickCreateModal.tsx  # C 단축키
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts            # supabase gen types
│   │   ├── queries/                # TanStack Query hooks
│   │   │   ├── issues.ts
│   │   │   ├── sprints.ts
│   │   │   └── projects.ts
│   │   ├── stores/                 # Zustand
│   │   │   └── ui.ts
│   │   ├── markdown.ts             # 렌더링 + 멘션 처리
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useRealtime.ts
│   │   └── useShortcuts.ts
│   └── styles/
│       └── globals.css
├── supabase/                       # 위 3·4장 참고
├── tests/
│   ├── unit/
│   └── e2e/
├── biome.json
├── next.config.ts
├── package.json
├── tsconfig.json
└── docker-compose.yml              # 로컬 호스팅용
```

---

## 7. 환경 변수 / 시크릿

```env
# .env.local (개발자 머신)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# 서버 전용 (Edge Function 환경변수로 설정)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # 절대 클라이언트 노출 X
GITHUB_WEBHOOK_SECRET=...
SLACK_SIGNING_SECRET=...                  # 슬랙 인터랙션 검증용 (2단계)
S3_BUCKET=bbodek-slate-attachments
S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
JIRA_BASE_URL=https://bbodek.atlassian.net
JIRA_EMAIL=...
JIRA_API_TOKEN=...

# Postgres 안에서 사용 (cron 호출용)
app.edge_functions_url=https://<project>.supabase.co/functions/v1
app.service_role_key=eyJhbGciOi...
```

시크릿 관리:
- **로컬**: `.env.local` (gitignore)
- **Edge Function**: `supabase secrets set` 명령으로 등록
- **DB 안에서 참조**: `select set_config('app.xxx', '...', false)` (마이그레이션에서 1회 설정)
- **슬랙 봇 토큰**: DB의 `slack_workspaces.bot_token` 컬럼은 Supabase Vault로 wrap

---

## 8. 배포 파이프라인

### 8.1 환경 구분

| 환경 | 프론트엔드 | Supabase |
|---|---|---|
| Local Dev | `pnpm dev` (localhost:3000) | Supabase CLI 로컬 또는 dev 프로젝트 |
| Team Dev (1단계) | Docker Compose 사내 머신 | Supabase Cloud (`slate-dev`) |
| Prod (2단계) | Vercel | Supabase Cloud (`slate-prod`) |

### 8.2 1단계 (로컬) 흐름

```bash
# 초기 셋업
git clone <repo>
cd slate
pnpm install
cp .env.example .env.local
# Supabase 프로젝트 만들고 URL/anon key 채움

# DB 마이그레이션
supabase link --project-ref <project-ref>
supabase db push                # migrations/*.sql 적용
supabase functions deploy       # Edge Functions 배포

# 시드 (DOTOLI 프로젝트)
supabase db execute -f supabase/migrations/20260601000004_seed_dotoli.sql

# 프론트엔드 실행 (사내 머신에서)
docker-compose up -d
# → http://<사내IP>:3000
```

### 8.3 GitHub Actions (CI)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm biome check .
      - run: pnpm test
      - run: pnpm test:e2e --reporter=github

  deploy-functions:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-db:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

### 8.4 2단계 추가 (공개 호스팅)

- Vercel에 `apps/web` 연결 → main 머지 자동 배포
- 커스텀 도메인 연결 (예: `slate.bbodek.com`)
- 노션 언펄용 OG 메타 태그 SSR 활성화 (`app/i/[issueKey]/page.tsx`에 `generateMetadata`)

---

## 9. 개발 환경 셋업

### 9.1 사전 요구사항

- Node.js 20 LTS, pnpm 9
- Docker Desktop (Compose 사용)
- Supabase CLI (`npm i -g supabase`)
- AWS CLI (S3 권한 설정용)
- GitHub Personal Access Token (마이그레이션 테스트용)

### 9.2 onboarding.md (개발자 첫 셋업)

```bash
# 1. 저장소 클론
git clone git@github.com:bbodek/slate.git && cd slate

# 2. 의존성 설치
pnpm install

# 3. Supabase 프로젝트 생성 (개인 dev용)
# → supabase.com에서 새 프로젝트 만들고 키 복사

# 4. 환경변수
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 채움

# 5. DB 스키마 적용
supabase link --project-ref <자신의 ref>
supabase db push

# 6. 타입 생성
supabase gen types typescript --linked > src/lib/supabase/types.ts

# 7. Edge Functions 환경변수 설정
supabase secrets set GITHUB_WEBHOOK_SECRET=...
supabase secrets set S3_BUCKET=...
# (개발 단계에선 본인 AWS 키 사용)

# 8. 시드
supabase db execute -f supabase/migrations/20260601000004_seed_dotoli.sql

# 9. 로컬 실행
pnpm dev
# → http://localhost:3000
```

### 9.3 자주 쓰는 명령

```bash
pnpm dev                         # 로컬 실행
pnpm test                        # 단위 테스트
pnpm test:e2e                    # E2E (Playwright)
pnpm biome check . --apply       # lint + format
supabase db diff -f <name>       # 스키마 변경 → 새 마이그레이션 파일
supabase db push                 # DB에 반영
supabase gen types typescript --linked > src/lib/supabase/types.ts
supabase functions serve         # Edge Function 로컬 실행
```

---

## 10. 테스트 전략

### 10.1 레이어별 전략

| 레이어 | 도구 | 다룰 것 |
|---|---|---|
| 유틸/순수 함수 | Vitest | 마크다운 파싱, 이슈 키 추출, 날짜 포맷 |
| React 컴포넌트 | Vitest + Testing Library | IssueCard 렌더, 드롭다운 인터랙션 |
| DB 함수/RLS | pgTAP 또는 Supabase 통합 테스트 | 트리거 동작, RLS 정책 |
| Edge Function | Deno test + 로컬 Supabase | github-webhook 페이로드 처리 |
| E2E | Playwright | 로그인 → 이슈 생성 → 보드 이동 → 코멘트 |

### 10.2 핵심 E2E 시나리오 (1단계 출시 전 통과 필수)

1. 로그인 → 보드 진입 → Active 스프린트 카드들 보임
2. 빠른 생성 (`C`) → 새 이슈 → 보드에 즉시 반영 (Realtime)
3. 카드 드래그 → 상태 변경 → 슬랙 채널에 메시지 (mocked)
4. 이슈 상세 → 코멘트 작성 + @멘션 → 인앱 알림 도착
5. 스프린트 마감 → 미완료 이슈 "다음 스프린트로" → 새 스프린트로 이동
6. GitHub 웹훅 모의 페이로드 → 이슈 페이지에 PR 링크 표시 + 머지 시 Done
7. 첨부파일 업로드 → S3 presigned → 다운로드 링크 동작

### 10.3 부하 테스트 (선택)

이슈 5000건 + 사용자 20명 동시 접속 시나리오로 보드 로딩 시간 측정. k6 또는 Artillery.

---

## 11. 모니터링 / 운영

- **에러**: Sentry (Next.js + Edge Function 모두). 로컬 환경에선 콘솔 로그만.
- **분석**: 1단계에선 PostHog 미적용. 활동 로그로 충분.
- **상태 페이지**: 별도 X. Supabase 자체 상태페이지 의존.
- **알림 실패 모니터링**: `slack_notify_queue` 가시성 타임아웃 초과 메시지 수를 admin 대시보드에 표시.

---

## 12. 보안 체크리스트

- [ ] RLS 모든 테이블에 활성화 + 정책 작성
- [ ] service_role_key는 Edge Function/CI에만, 클라이언트 절대 X
- [ ] GitHub 웹훅 서명 검증 (HMAC SHA-256)
- [ ] Slack 인터랙션 (2단계) signing secret 검증
- [ ] S3 presigned URL 만료 1시간, 다운로드 URL은 인증 필요
- [ ] 회사 도메인(`@bbodek.com`) 외 가입 차단 (Auth Hook으로)
- [ ] 세션 만료 14일
- [ ] DB 백업: Supabase 일일 자동 백업 (Pro 플랜)
- [ ] 슬랙 봇 토큰: Vault wrap

---

## 13. 1단계 마일스톤 제안

| 주차 | 산출물 |
|---|---|
| W1 | 저장소 셋업, Supabase 프로젝트 생성, 스키마/RLS 초기 마이그레이션, Next.js 부트스트랩, Google OAuth 로그인 동작 |
| W2 | 이슈 CRUD, 프로젝트/사용자 관리, 라벨/우선순위/마감일 |
| W3 | 스프린트 + 보드 + 백로그 + 드래그앤드롭 |
| W4 | 코멘트, 활동 로그, 첨부파일(S3), 검색/필터 |
| W5 | 깃헙 웹훅 Edge Function, PR 자동 링크 + 자동 상태 전환 |
| W6 | Slack 알림 Edge Function, 통합 채널 발송, 알림 큐 |
| W7 | 스프린트 리포트 + 벨로시티, 알림 벨, 단축키 |
| W8 | 지라 import Edge Function (Phase A dry run), QA, E2E 통과, 점진적 마이그레이션 Phase B 시작 |

> 일정은 1인 풀타임 기준 가이드. 인원/할당량에 따라 조정.

---

## 14. 변경 이력

| 버전 | 날짜 | 변경 |
|---|---|---|
| 1.0 | 2026-06 | PRD v1.0 기반 초안 작성 (도구 이름 Tick) |
| 1.1 | 2026-06 | 도구 이름 **Tick → Slate** 일괄 치환. S3 키 prefix, 슬랙 채널명, 깃 리포 경로, 도메인 예시도 함께 갱신. 스택/스키마/Edge Function 로직은 동일. |
