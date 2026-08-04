// 서버/클라이언트 양쪽에서 import되는 상수 — 서버 전용 모듈에 두지 말 것
export const ALLOWED_EMAIL_DOMAIN = "bbodek.com";

// 이슈 도메인 (PRD 3.1 — 상태/타입/우선순위 고정)
export const ISSUE_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const ISSUE_TYPES = ["story", "task", "bug", "epic"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  story: "Story",
  task: "Task",
  bug: "Bug",
  epic: "Epic",
};

export const ISSUE_PRIORITIES = ["highest", "high", "medium", "low", "lowest"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  lowest: "Lowest",
};

export const STORY_POINT_OPTIONS = [0, 1, 2, 3, 5, 8, 13] as const;

// GitHub 연동 (TDD 3장 github_links — kind/PR state 고정)
export const GITHUB_LINK_KINDS = ["pr", "commit"] as const;
export type GithubLinkKind = (typeof GITHUB_LINK_KINDS)[number];

export const GITHUB_PR_STATES = ["open", "merged", "closed"] as const;
export type GithubPrState = (typeof GITHUB_PR_STATES)[number];

// 인앱 알림 type — DB 트리거(20260804000001_notification_triggers)와의 계약
export const NOTIFICATION_TYPES = ["assigned", "status_changed", "commented"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const GITHUB_PR_STATE_LABELS: Record<GithubPrState, string> = {
  open: "Open",
  merged: "Merged",
  closed: "Closed",
};

// 디자인 핸드오프 3.2 — 라벨·프로젝트·에픽 등 사용자 지정 색 8색 팔레트
export const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#64748b",
] as const;

export function isIssueStatus(value: string): value is IssueStatus {
  return (ISSUE_STATUSES as readonly string[]).includes(value);
}

export function isIssueType(value: string): value is IssueType {
  return (ISSUE_TYPES as readonly string[]).includes(value);
}

export function isIssuePriority(value: string): value is IssuePriority {
  return (ISSUE_PRIORITIES as readonly string[]).includes(value);
}

export function isGithubPrState(value: string): value is GithubPrState {
  return (GITHUB_PR_STATES as readonly string[]).includes(value);
}
