import type { IssueStatus, IssueType } from "@/lib/constants";
import type { BoardIssue } from "@/lib/queries/board-issues";

/** 담당자 없음 / 에픽 없음을 나타내는 sentinel (실제 UUID와 겹치지 않음) */
export const UNASSIGNED = "__unassigned__";
export const NO_EPIC = "__none__";

/**
 * 보드·백로그 공통 필터. 각 차원은 배열 — 비어 있으면 그 차원엔 제약 없음(전체).
 * 한 차원 안은 OR(선택 중 하나라도), 차원 간은 AND.
 */
export type IssueFilters = {
  assigneeIds: string[]; // 사용자 id 또는 UNASSIGNED
  types: IssueType[];
  labelIds: string[];
  epicIds: string[]; // 에픽 이슈 id 또는 NO_EPIC
  statuses: IssueStatus[];
};

export const EMPTY_FILTERS: IssueFilters = {
  assigneeIds: [],
  types: [],
  labelIds: [],
  epicIds: [],
  statuses: [],
};

export type FilterDimension = keyof IssueFilters;

function matchesAssignee(issue: BoardIssue, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (issue.assignee) return selected.includes(issue.assignee.id);
  return selected.includes(UNASSIGNED);
}

function matchesLabels(issue: BoardIssue, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return issue.labels.some((label) => selected.includes(label.id));
}

function matchesEpic(issue: BoardIssue, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (issue.epic_id) return selected.includes(issue.epic_id);
  return selected.includes(NO_EPIC);
}

/** 필터를 이슈 목록에 적용 (그룹핑 전 단계에서 호출) */
export function filterIssues(issues: BoardIssue[], filters: IssueFilters): BoardIssue[] {
  return issues.filter(
    (issue) =>
      matchesAssignee(issue, filters.assigneeIds) &&
      (filters.types.length === 0 || filters.types.includes(issue.type)) &&
      matchesLabels(issue, filters.labelIds) &&
      matchesEpic(issue, filters.epicIds) &&
      (filters.statuses.length === 0 || filters.statuses.includes(issue.status)),
  );
}

/** 선택된 필터 값의 총 개수 (활성 여부·초기화 버튼 표시용) */
export function activeFilterCount(filters: IssueFilters): number {
  return (
    filters.assigneeIds.length +
    filters.types.length +
    filters.labelIds.length +
    filters.epicIds.length +
    filters.statuses.length
  );
}

export type AssigneeOption = { id: string; name: string; avatarUrl: string | null };
export type LabelOption = { id: string; name: string; color: string };
export type EpicOption = { id: string; title: string };

export type FilterOptions = {
  assignees: AssigneeOption[];
  labels: LabelOption[];
  epics: EpicOption[];
  hasUnassigned: boolean;
  hasNoEpic: boolean;
};

/**
 * 이슈 목록에서 필터 옵션을 유도. 옵션은 필터가 걸리기 전(scope 전체) 목록에서 뽑아
 * 필터링해도 선택지가 사라지지 않게 한다.
 */
export function deriveFilterOptions(issues: BoardIssue[]): FilterOptions {
  const assignees = new Map<string, AssigneeOption>();
  const labels = new Map<string, LabelOption>();
  const epics = new Map<string, EpicOption>();
  let hasUnassigned = false;
  let hasNoEpic = false;

  for (const issue of issues) {
    if (issue.assignee) {
      assignees.set(issue.assignee.id, {
        id: issue.assignee.id,
        name: issue.assignee.name,
        avatarUrl: issue.assignee.avatar_url,
      });
    } else {
      hasUnassigned = true;
    }
    for (const label of issue.labels) {
      labels.set(label.id, { id: label.id, name: label.name, color: label.color });
    }
    if (issue.type === "epic") {
      epics.set(issue.id, { id: issue.id, title: issue.title });
    }
    if (!issue.epic_id) hasNoEpic = true;
  }

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return {
    assignees: [...assignees.values()].sort(byName),
    labels: [...labels.values()].sort(byName),
    epics: [...epics.values()].sort((a, b) => a.title.localeCompare(b.title)),
    hasUnassigned,
    hasNoEpic,
  };
}
