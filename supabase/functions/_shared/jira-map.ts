// Jira 이슈 → Slate 이슈 매핑 (순수 함수, Deno/Node 양쪽에서 import 가능하도록 런타임 의존 없음).
// jira-import Edge Function이 사용하고, 매핑 정확성은 이 모듈을 단위 테스트해 검증한다.

export type SlateIssueType = "story" | "task" | "bug" | "epic";
export type SlateIssueStatus = "todo" | "in_progress" | "in_review" | "done";
export type SlateIssuePriority = "highest" | "high" | "medium" | "low" | "lowest";

export type JiraUser = {
  emailAddress?: string;
  displayName?: string;
  accountId?: string;
} | null;

export type JiraIssue = {
  key: string;
  fields: {
    summary?: string;
    issuetype?: { name?: string };
    status?: { name?: string; statusCategory?: { key?: string } };
    priority?: { name?: string };
    assignee?: JiraUser;
    reporter?: JiraUser;
    labels?: string[];
    description?: unknown;
  };
};

export type SlateUserRef = { id: string; email: string; name: string };

export type MappedIssue = {
  key: string;
  title: string;
  type: SlateIssueType;
  status: SlateIssueStatus;
  priority: SlateIssuePriority;
  assignee_id: string | null;
  reporter_id: string | null;
  labels: string[];
};

export type MapLevel = "ok" | "warn" | "fail";

export type MapResult = {
  key: string;
  level: MapLevel;
  notes: string[];
  mapped: MappedIssue;
};

// Jira 이슈 타입(한글/영문) → Slate 타입. 하위 작업은 Slate에 없어 task로.
const TYPE_MAP: Record<string, SlateIssueType> = {
  작업: "task",
  버그: "bug",
  에픽: "epic",
  스토리: "story",
  "하위 작업": "task",
  task: "task",
  bug: "bug",
  epic: "epic",
  story: "story",
  subtask: "task",
};

// Jira statusCategory.key → Slate 상태. in_review는 Slate 고유라 카테고리로는 안 나와 상태명으로 보정.
const STATUS_CATEGORY_MAP: Record<string, SlateIssueStatus> = {
  new: "todo",
  indeterminate: "in_progress",
  done: "done",
};

const PRIORITIES: SlateIssuePriority[] = ["highest", "high", "medium", "low", "lowest"];

function isPriority(value: string): value is SlateIssuePriority {
  return (PRIORITIES as string[]).includes(value);
}

/** 상태명이 검토/리뷰를 뜻하면 in_review로 보정 */
function looksLikeReview(statusName: string | undefined): boolean {
  if (!statusName) return false;
  const lowered = statusName.toLowerCase();
  return lowered.includes("review") || statusName.includes("검토") || statusName.includes("리뷰");
}

function matchUser(user: JiraUser, usersByEmail: Map<string, SlateUserRef>): string | null {
  const email = user?.emailAddress?.toLowerCase();
  if (!email) return null;
  return usersByEmail.get(email)?.id ?? null;
}

/** Jira 이슈 1건을 Slate 형태로 매핑하고, 미비 항목을 notes/level로 표시 */
export function mapJiraIssue(issue: JiraIssue, usersByEmail: Map<string, SlateUserRef>): MapResult {
  // warnings = 실제 매핑 문제(사용자 미매칭·미상 enum·빈 제목) → level에 반영
  // infos = 정상 후속작업(본문 변환·라벨 생성) → 노출만 하고 level엔 미반영 (신호 희석 방지)
  const warnings: string[] = [];
  const infos: string[] = [];
  const fields = issue.fields ?? {};

  const title = (fields.summary ?? "").trim();
  if (!title) warnings.push("제목(summary) 없음");

  const typeName = fields.issuetype?.name ?? "";
  const type = TYPE_MAP[typeName];
  if (!type) warnings.push(`알 수 없는 이슈 타입 "${typeName}" → task로 대체`);

  const categoryKey = fields.status?.statusCategory?.key ?? "";
  let status = STATUS_CATEGORY_MAP[categoryKey];
  if (!status) warnings.push(`알 수 없는 상태 카테고리 "${categoryKey}" → todo로 대체`);
  else if (status === "in_progress" && looksLikeReview(fields.status?.name)) status = "in_review";

  const priorityName = (fields.priority?.name ?? "").toLowerCase();
  const priority = isPriority(priorityName) ? priorityName : "medium";
  if (!isPriority(priorityName)) {
    warnings.push(`알 수 없는 우선순위 "${fields.priority?.name ?? ""}" → medium으로 대체`);
  }

  // 보고자: Slate에서 필수(NOT NULL). 매칭 실패면 import 불가 → fail
  const reporter_id = matchUser(fields.reporter ?? null, usersByEmail);
  if (!reporter_id) {
    const who = fields.reporter?.displayName ?? "(미상)";
    warnings.push(`보고자 "${who}" 이메일 미노출/미매칭 → Slate 사용자 매핑 필요`);
  }

  // 담당자: 있는데 매칭 실패면 경고, 없으면 정상(미지정)
  const assignee_id = matchUser(fields.assignee ?? null, usersByEmail);
  if (fields.assignee && !assignee_id) {
    warnings.push(`담당자 "${fields.assignee.displayName ?? "(미상)"}" 미매칭 → 미지정으로`);
  }

  const labels = fields.labels ?? [];
  if (labels.length > 0) infos.push(`라벨 ${labels.length}개는 Slate 라벨 생성 필요`);
  if (fields.description != null) infos.push("본문(description) ADF→마크다운 변환 필요");

  const level: MapLevel = !reporter_id ? "fail" : warnings.length > 0 ? "warn" : "ok";

  return {
    key: issue.key,
    level,
    notes: [...warnings, ...infos],
    mapped: {
      key: issue.key,
      title,
      type: type ?? "task",
      status: status ?? "todo",
      priority,
      assignee_id,
      reporter_id,
      labels,
    },
  };
}
