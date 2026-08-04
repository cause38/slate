import type { JiraIssue } from "./jira-map.ts";

// Jira Cloud REST v3 검색. 자격증명(JIRA_BASE_URL/EMAIL/API_TOKEN)은 Supabase 시크릿으로 주입.
// 토큰 미설정 시 throw — 호출부(jira-import)에서 sampleIssues 경로로 대체 가능.

const SEARCH_FIELDS = [
  "summary",
  "issuetype",
  "status",
  "priority",
  "assignee",
  "reporter",
  "labels",
  "description",
];
const PAGE_SIZE = 50;
const MAX_ISSUES = 500; // dry-run 안전 상한

function jiraCredentials(): { base: string; auth: string } {
  const base = Deno.env.get("JIRA_BASE_URL");
  const email = Deno.env.get("JIRA_EMAIL");
  const token = Deno.env.get("JIRA_API_TOKEN");
  if (!base || !email || !token) {
    throw new Error("Jira 자격증명(JIRA_BASE_URL/EMAIL/API_TOKEN) 미설정");
  }
  return { base: base.replace(/\/$/, ""), auth: btoa(`${email}:${token}`) };
}

/**
 * JQL로 이슈를 조회 (상한 MAX_ISSUES). 신규 `/search/jql` + nextPageToken 페이지네이션.
 * classic `/search`(startAt/maxResults)는 폐기 예정이고, maxResults보다 적게 반환될 때
 * 조기 종료로 이슈가 누락될 수 있어 토큰 방식으로 안전하게 끝까지 순회한다.
 */
export async function jiraSearch(jql: string): Promise<JiraIssue[]> {
  const { base, auth } = jiraCredentials();
  const issues: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  do {
    const url = new URL(`${base}/rest/api/3/search/jql`);
    url.searchParams.set("jql", jql);
    url.searchParams.set("fields", SEARCH_FIELDS.join(","));
    url.searchParams.set("maxResults", String(PAGE_SIZE));
    if (nextPageToken) url.searchParams.set("nextPageToken", nextPageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Jira search ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      issues?: JiraIssue[];
      nextPageToken?: string;
      isLast?: boolean;
    };
    issues.push(...(data.issues ?? []));
    nextPageToken = data.isLast ? undefined : data.nextPageToken;
  } while (nextPageToken && issues.length < MAX_ISSUES);

  return issues.slice(0, MAX_ISSUES);
}
