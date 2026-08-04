import { type JiraIssue, type SlateUserRef, mapJiraIssue } from "../_shared/jira-map.ts";
import { jiraSearch } from "../_shared/jira.ts";
import { createServiceClient } from "../_shared/supabase.ts";

// Phase A = dry run: Jira 이슈를 매핑만 하고 jira_migration_logs에 기록. issues 테이블에는 쓰지 않는다.
// 자격증명 없으면 sampleIssues(요청 본문)로 매핑 — 테스트/선택적 이관용.

const SAMPLE_LIMIT = 10; // 응답에 미리보기로 담을 결과 수

Deno.serve(async (req) => {
  const supabase = createServiceClient();

  // 1. 관리자 인증 (dry-run이라도 전체 Jira 데이터 조회이므로 admin 전용)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") {
    return Response.json({ error: "admin only" }, { status: 403 });
  }

  // 2. 요청 파싱
  let body: { jql?: string; projectKey?: string; sampleIssues?: JiraIssue[] } = {};
  try {
    body = await req.json();
  } catch {
    // 본문 없으면 기본값 사용
  }

  // 3. Slate 사용자 → email 매핑 소스
  const { data: users } = await supabase.from("users").select("id, email, name");
  const usersByEmail = new Map<string, SlateUserRef>(
    (users ?? [])
      .filter((u): u is SlateUserRef => Boolean(u.email))
      .map((u) => [u.email.toLowerCase(), u]),
  );

  // 4. 이슈 확보: sampleIssues(비어있지 않을 때만) 우선, 없으면 Jira 조회
  const hasSamples = Array.isArray(body.sampleIssues) && body.sampleIssues.length > 0;
  let issues: JiraIssue[];
  try {
    issues = hasSamples
      ? (body.sampleIssues as JiraIssue[])
      : await jiraSearch(
          body.jql ?? `project = ${body.projectKey ?? "DOTOLI"} ORDER BY created ASC`,
        );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Jira 조회 실패" },
      { status: 502 },
    );
  }

  // key 없는 malformed 이슈는 로그 insert(jira_issue_key NOT NULL)를 깨므로 걸러낸다
  const validIssues = issues.filter((issue): issue is JiraIssue =>
    Boolean(issue && typeof issue.key === "string" && issue.key),
  );
  const skippedMalformed = issues.length - validIssues.length;

  // 5. 매핑 + dry-run 로그 (Phase A는 issues 미기록)
  const results = validIssues.map((issue) => mapJiraIssue(issue, usersByEmail));
  const logRows = results.map((r) => ({
    jira_issue_key: r.key,
    new_issue_id: null,
    status: r.level,
    notes: r.notes.join("; ") || null,
  }));
  if (logRows.length > 0) {
    const { error: logError } = await supabase.from("jira_migration_logs").insert(logRows);
    if (logError) {
      return Response.json({ error: `로그 기록 실패: ${logError.message}` }, { status: 500 });
    }
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.level === "ok").length,
    warn: results.filter((r) => r.level === "warn").length,
    fail: results.filter((r) => r.level === "fail").length,
    skippedMalformed,
  };
  return Response.json({
    phase: "A",
    dryRun: true,
    summary,
    sample: results.slice(0, SAMPLE_LIMIT),
  });
});
