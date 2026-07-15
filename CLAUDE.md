# CLAUDE.md — Slate 프로젝트

> Claude Code 진입 시 자동으로 읽는 문서. 이 저장소에 들어온 순간 이 문서와 아래 참조 문서들부터 읽고 작업을 시작할 것.

---

## 프로젝트 한 줄 정의

**Slate** — 뽀득(bbodek) 사내 개발팀(5~20명)용 지라 대체 이슈 트래커. 2주 스프린트 · 칸반 · 에픽 · GitHub/Slack 연동 중심. 1단계는 로컬 프론트엔드 + Supabase Cloud 백엔드.

---

## 필독 참조 문서 (읽는 순서 그대로)

| 순서 | 파일 | 목적 | 필독도 |
|---|---|---|---|
| 1 | `docs/PRD_사내_이슈트래커.md` | 기능·시나리오·미정사항 | 🔴 필수 |
| 2 | `docs/TDD_Slate_기술설계서.md` | 스택·스키마·Edge Function·배포 | 🔴 필수 |
| 3 | `docs/Slate_와이어프레임.html` | 10개 화면 레이아웃 (브라우저로 열어서 확인) | 🟡 UI 작업 전 필수 |
| 4 | `docs/Slate_디자인_핸드오프.md` | 컬러·타이포·컴포넌트 시스템 | 🟡 UI 작업 시 |

**작업 전 관련 문서 다시 확인**은 필수. 특히 데이터 모델·이슈 키 정책·슬랙 알림 정책 같은 이미 확정된 결정을 임의로 바꾸지 말 것.

---

## 현재 상태

- ✅ PRD v1.1 잠금
- ✅ TDD v1.1 작성 완료
- ✅ 와이어프레임 v1.1 작성 완료
- ✅ 디자인 핸드오프 문서 작성 완료
- ⏳ **개발 착수 지점** — 아직 코드 없음. TDD 13장 (1단계 마일스톤) W1부터 시작.

---

## 시작하는 법

`W1부터 진행해줘` 라는 지시를 받으면:

1. TDD 8장 "배포 파이프라인" 및 9장 "개발 환경 셋업"을 다시 읽는다.
2. 아래 순서로 진행한다:
   1. 저장소 초기화 (`pnpm init`, `.gitignore`, `.editorconfig`, `biome.json`)
   2. Next.js 15 (App Router) 부트스트랩 (`pnpm create next-app`, TypeScript, Tailwind, App Router)
   3. shadcn/ui 초기화 (테마: **Zinc + Blue 악센트**, 다크 모드 디폴트)
   4. Supabase 프로젝트 생성 안내 (사용자가 브라우저에서 수동 생성 후 URL/anon key 전달)
   5. `supabase/migrations/` 4개 파일 작성 (TDD 3장 스키마 그대로)
   6. 타입 자동 생성 (`supabase gen types typescript --linked`)
   7. Google OAuth 설정 (Supabase Auth 콘솔 안내)
   8. `app/login/page.tsx` + `app/page.tsx` (홈) 작성 — 와이어프레임 화면 1, 2 참조
   9. 도메인 화이트리스트 (`@bbodek.com`) — Auth Hook 또는 middleware
   10. `docker-compose.yml` 작성 (사내 머신 배포용)
   11. E2E 테스트 1개 통과: 로그인 → 홈 이동
3. 각 단계마다 사용자에게 진행 상황 알리고 확인 받기. 특히 Supabase 프로젝트 생성 · Google OAuth Client ID 발급은 사용자가 직접 해야 하는 작업이라 반드시 대기.

---

## 절대 원칙 (Non-negotiables)

1. **이슈 키는 자연 증가, 0 패딩 없음** — `DOTOLI-1`, `DOTOLI-42`, `DOTOLI-1000`
2. **슬랙 알림은 변경 1건 = 메시지 1개**. 묶기·스레딩·batching 금지 (2단계)
3. **슬랙 채널은 워크스페이스 단위 단일 채널**. 프로젝트별 채널 매핑 금지 (2단계)
4. **DM 알림 없음**. 통합 채널 + 인앱만
5. **1단계는 로컬 호스팅**. 노션 언펄은 2단계로 확정
6. **다중 프로젝트 지원**이 데이터 모델 전제. DOTOLI는 시드 프로젝트 1개일 뿐, 하드코딩 금지
7. **RLS 모든 테이블에 활성화** (예외 없음)
8. **service_role_key는 서버·Edge Function에만**, 클라이언트 노출 절대 금지

---

## 기술 스택 요약

- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zustand + dnd-kit + react-hook-form + zod
- **Backend**: Supabase Cloud (Postgres 15 + Auth + Storage + Realtime + Edge Functions/Deno)
- **첨부파일**: AWS S3 (presigned URL 방식, Supabase Storage 미사용)
- **패키지 매니저**: pnpm
- **린트/포맷**: Biome (ESLint/Prettier 대신)
- **테스트**: Vitest + Playwright
- **CI**: GitHub Actions

TDD 1장에 상세 근거 있음.

---

## 저장소 구조 (목표)

```
slate/
├── CLAUDE.md                    ← 이 문서
├── docs/
│   ├── PRD_사내_이슈트래커.md
│   ├── TDD_Slate_기술설계서.md
│   ├── Slate_와이어프레임.html
│   └── Slate_디자인_핸드오프.md
├── apps/
│   └── web/                     ← Next.js 앱 (TDD 6장 참조)
├── supabase/
│   ├── migrations/              ← SQL 마이그레이션 (TDD 3장)
│   ├── functions/               ← Edge Functions (TDD 4장)
│   └── config.toml
├── docker-compose.yml
├── biome.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 코딩 컨벤션

**언어·표기**
- 문서·PR 설명·커밋 메시지는 **한국어** 우선. 코드 identifier는 영어.
- 코드 주석은 필요할 때만. "무엇을 하는지"보다 "왜 이렇게 하는지"에 집중.

**TypeScript**
- `any` 금지. 부득이하면 `unknown` + 타입 가드.
- Supabase 타입은 항상 자동 생성된 `src/lib/supabase/types.ts` 사용.
- 컴포넌트 props는 반드시 named type/interface.

**React**
- 함수형 컴포넌트만. `default export` 지양, named export 선호.
- 클라이언트 컴포넌트는 명시적 `"use client"`. 서버 컴포넌트 디폴트.
- 데이터 fetching: TanStack Query. 서버 컴포넌트에서 직접 fetch 가능하면 그것 우선.
- 상태 관리: 컴포넌트 내 `useState` → props 드릴링 3단계 이상이면 Zustand 스토어.

**스타일링**
- Tailwind만. 커스텀 CSS는 `globals.css`에만.
- shadcn/ui 컴포넌트는 `apps/web/src/components/ui/`에 자동 생성 그대로 두기.
- 색은 CSS variables (`--background`, `--foreground`, ...) 통해서만. 색 하드코딩 금지.
- 다크 모드는 `next-themes` + Tailwind `dark:` 유틸.

**파일 구조**
- 컴포넌트 파일은 PascalCase (`IssueCard.tsx`)
- 훅은 camelCase (`useIssueDrag.ts`)
- 유틸/라이브러리는 kebab-case (`markdown-render.ts`)
- 페이지 라우트는 Next.js App Router 규칙 그대로

**DB**
- 마이그레이션은 Supabase CLI (`supabase db diff -f <name>`)로 생성. 수동 편집 최소화.
- 컬럼 이름은 snake_case. TypeScript 쪽에서는 자동 생성된 타입 그대로 사용.
- 모든 테이블에 `created_at timestamptz not null default now()` 기본 포함.
- 마이그레이션 파일명: `YYYYMMDDHHMMSS_설명.sql`

**커밋**
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`
- 제목은 한국어 OK. 예: `feat: 로그인 페이지 Google OAuth 연결`
- 하나의 커밋은 하나의 논리적 변경만.

---

## 자주 쓰는 명령

```bash
# 개발
pnpm dev                             # localhost:3000
pnpm test                            # Vitest 단위
pnpm test:e2e                        # Playwright E2E
pnpm biome check . --apply           # lint + format

# Supabase
supabase db diff -f <name>           # 스키마 변경 → 새 마이그레이션
supabase db push                     # 클라우드에 반영
supabase gen types typescript --linked > apps/web/src/lib/supabase/types.ts
supabase functions serve             # Edge Function 로컬
supabase functions deploy <name>     # 배포
supabase secrets set KEY=value       # 시크릿 등록

# 시드
supabase db execute -f supabase/migrations/*_seed_dotoli.sql

# 프로덕션(사내 머신)
docker-compose up -d
```

---

## 작업 시 확인해야 할 것

**새 화면 만들 때**
1. `Slate_와이어프레임.html`에서 해당 화면 시각적으로 확인
2. PRD 3장(기능 명세)에서 그 화면 관련 부분 재확인
3. TDD 6장 폴더 구조에 맞는 위치에 파일 생성

**새 DB 필드/테이블 추가할 때**
1. TDD 3장 스키마와 충돌 없는지 확인
2. RLS 정책 반드시 함께 작성
3. `supabase gen types` 재실행해서 타입 갱신
4. 마이그레이션 파일로 남기기 (수동 SQL 실행 금지)

**Edge Function 추가할 때**
1. TDD 4장 폴더 구조 (`supabase/functions/<name>/index.ts`)
2. `_shared/`의 헬퍼 재사용 우선
3. GitHub 웹훅은 반드시 HMAC SHA-256 서명 검증
4. Slack 발송은 재시도 큐 로직 포함

**작업 완료 후**
- 관련 테스트 통과 확인
- `pnpm biome check .` 통과
- 변경한 문서(PRD/TDD) 있으면 변경 이력 표에 항목 추가

---

## 지금까지의 주요 결정 요약 (컨텍스트 손실 방지용)

- 이름: **Tick → Slate** (v1.1에서 변경)
- 팀 규모: **5~20명**, 인증 **Google OAuth** (`@bbodek.com` 도메인만)
- 권한: Member / Admin 2단계
- 이슈 타입: Story / Task / Bug / Epic
- 상태: To Do / In Progress / In Review / Done (고정)
- 스프린트: 2주 디폴트, 프로젝트당 Active 1개, 자동 다음 스프린트 생성 옵션
- 스토리 포인트: 있음 (0, 1, 2, 3, 5, 8, 13)
- 벨로시티: 1단계 포함. 번다운 차트: 2단계
- 검색: 필터 UI + 전문 검색. JQL 같은 쿼리 언어: 백로그
- 마이그레이션: 지라 → Slate 점진적 (Phase A→B→C→D), D-day 없음
- 노션 언펄: **2단계** (로컬 호스팅 결정으로 인해)
- 슬랙 봇 이름: **Slate**, 아이콘 후보: ◆ 또는 슬레이트 모티프

미정사항은 PRD 9장에 정리되어 있음. 개발 중 필요하면 사용자에게 물어볼 것.

---

## 팀 컨텍스트

- 사용자 = **진주** (jj.park@bbodek.com), 프론트엔드 개발자
- 회사 = 뽀득 (bbodek), 도메인 `@bbodek.com`
- 기존 지라 있음, 점진적으로 Slate로 이전 예정
- 대화 언어: 한국어

---

## 도움말

- 무언가 결정해야 하는데 문서에 없다 → PRD 9장 "미정사항"에 추가하고 사용자에게 질문
- 기존 결정과 충돌하는 요청이 들어옴 → 사용자에게 확인 후 진행 (기존 문서를 조용히 바꾸지 말 것)
- 스택 외 도구 사용해야 함 → TDD 1.2 "의도적으로 안 쓰는 것" 확인, 사용자에게 이유 설명

Happy coding. W1부터 시작.
