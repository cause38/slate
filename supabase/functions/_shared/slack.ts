// Slack Incoming Webhook 발송 + Block Kit 메시지 구성.
// 봇 토큰/Web API 대신 웹훅 URL 하나에 POST하는 1단계 방식.

// apps/web/src/lib/constants.ts의 라벨을 미러링 (Deno/Node 런타임 경계로 모듈 공유 불가).
const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};
const PRIORITY_LABELS: Record<string, string> = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  lowest: "Lowest",
};

// Slack webhook 응답 지연이 배치 전체를 막지 않도록 발송 타임아웃(ms)
const WEBHOOK_TIMEOUT_MS = 5000;

export type IssueForSlack = {
  key: string;
  title: string;
  assignee: { name: string } | null;
  project: { key: string; name: string } | null;
};

export type QueueEvent = {
  issue_id: string;
  event: string;
  old?: unknown;
  new?: unknown;
  actor?: string | null;
};

export type SlackMessage = {
  text: string;
  blocks: unknown[];
};

function label(map: Record<string, string>, value: unknown): string {
  return typeof value === "string" ? (map[value] ?? value) : "없음";
}

/**
 * 사용자 입력을 Slack mrkdwn에 안전하게 삽입 (&, <, > 이스케이프).
 * 특히 제목에 <https://…|링크> 형태가 들어와 공용 채널에 링크가 렌더되는 것을 막는다.
 */
function escapeSlackText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 큐 이벤트 1건 → Slack 메시지 (변경 1건 = 메시지 1개 정책) */
export function buildSlackMessage(
  issue: IssueForSlack,
  event: QueueEvent,
  actorName: string | null,
): SlackMessage {
  const tag = `*${escapeSlackText(issue.key)}* ${escapeSlackText(issue.title)}`;
  let line: string;
  switch (event.event) {
    case "created":
      line = `🆕 이슈 생성 · ${tag}`;
      break;
    case "status_changed":
      line = `🔀 상태 변경 · ${tag}\n${label(STATUS_LABELS, event.old)} → ${label(STATUS_LABELS, event.new)}`;
      break;
    case "priority_changed":
      line = `⚡ 우선순위 변경 · ${tag}\n${label(PRIORITY_LABELS, event.old)} → ${label(PRIORITY_LABELS, event.new)}`;
      break;
    case "assignee_changed":
      line = `👤 담당자 변경 · ${tag}\n→ ${escapeSlackText(issue.assignee?.name ?? "미지정")}`;
      break;
    case "sprint_changed":
      line = `🏃 스프린트 변경 · ${tag}`;
      break;
    case "epic_changed":
      line = `📦 에픽 변경 · ${tag}`;
      break;
    default:
      line = `${event.event} · ${tag}`;
  }

  const contextParts = [
    issue.project ? escapeSlackText(issue.project.name) : null,
    actorName ? `by ${escapeSlackText(actorName)}` : null,
  ].filter(Boolean);
  const blocks: unknown[] = [{ type: "section", text: { type: "mrkdwn", text: line } }];
  if (contextParts.length) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: contextParts.join(" · ") }],
    });
  }

  return { text: `[${issue.key}] ${issue.title}`, blocks };
}

/** Slack Incoming Webhook으로 발송. 실패 시 throw (호출부에서 큐 재시도로 이어짐) */
export async function postToSlackWebhook(webhookUrl: string, message: SlackMessage): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Slack webhook ${res.status}: ${await res.text()}`);
  }
}
