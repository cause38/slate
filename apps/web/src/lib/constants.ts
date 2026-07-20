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
