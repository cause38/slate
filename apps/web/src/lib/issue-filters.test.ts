import {
  EMPTY_FILTERS,
  NO_EPIC,
  UNASSIGNED,
  activeFilterCount,
  deriveFilterOptions,
  filterIssues,
} from "@/lib/issue-filters";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { describe, expect, it } from "vitest";

function issue(over: Partial<BoardIssue>): BoardIssue {
  return {
    id: crypto.randomUUID(),
    key: "K-1",
    title: "t",
    story_points: null,
    sprint_id: null,
    epic_id: null,
    rank: null,
    due_date: null,
    status: "todo",
    type: "task",
    priority: "medium",
    assignee: null,
    labels: [],
    ...over,
  };
}

const alice = { id: "u-alice", name: "Alice", avatar_url: null };
const bob = { id: "u-bob", name: "Bob", avatar_url: null };
const labelBug = { id: "l-bug", name: "bug", color: "#f00" };

describe("filterIssues", () => {
  const issues = [
    issue({ type: "bug", status: "done", assignee: alice, labels: [labelBug], epic_id: "e1" }),
    issue({ type: "task", status: "todo", assignee: bob }),
    issue({ type: "task", status: "todo", assignee: null }),
  ];

  it("빈 필터는 전체 통과", () => {
    expect(filterIssues(issues, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("한 차원 내 다중 선택은 OR", () => {
    const result = filterIssues(issues, { ...EMPTY_FILTERS, types: ["bug", "task"] });
    expect(result).toHaveLength(3);
  });

  it("차원 간은 AND", () => {
    const result = filterIssues(issues, {
      ...EMPTY_FILTERS,
      types: ["task"],
      statuses: ["todo"],
    });
    expect(result).toHaveLength(2);
  });

  it("담당자 UNASSIGNED sentinel은 미지정 이슈 매칭", () => {
    const result = filterIssues(issues, { ...EMPTY_FILTERS, assigneeIds: [UNASSIGNED] });
    expect(result).toHaveLength(1);
    expect(result[0].assignee).toBeNull();
  });

  it("담당자 id + UNASSIGNED 혼합(OR)", () => {
    const result = filterIssues(issues, { ...EMPTY_FILTERS, assigneeIds: ["u-alice", UNASSIGNED] });
    expect(result).toHaveLength(2);
  });

  it("라벨 필터는 해당 라벨 보유 이슈만", () => {
    const result = filterIssues(issues, { ...EMPTY_FILTERS, labelIds: ["l-bug"] });
    expect(result).toHaveLength(1);
  });

  it("에픽 NO_EPIC sentinel은 에픽 없는 이슈 매칭", () => {
    const result = filterIssues(issues, { ...EMPTY_FILTERS, epicIds: [NO_EPIC] });
    expect(result).toHaveLength(2);
  });
});

describe("activeFilterCount", () => {
  it("선택된 값의 총합", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, types: ["bug"], assigneeIds: ["u-alice", UNASSIGNED] }),
    ).toBe(3);
  });
});

describe("deriveFilterOptions", () => {
  it("담당자·라벨·에픽·sentinel 유무를 유도", () => {
    const issues = [
      issue({ assignee: alice, labels: [labelBug], epic_id: "e1" }),
      issue({ assignee: null }), // 미지정 → hasUnassigned
      issue({ type: "epic", title: "Epic A" }), // 에픽 이슈 → epics 옵션
    ];
    const options = deriveFilterOptions(issues);
    expect(options.assignees.map((a) => a.name)).toEqual(["Alice"]);
    expect(options.labels.map((l) => l.name)).toEqual(["bug"]);
    expect(options.epics).toEqual([{ id: issues[2].id, title: "Epic A" }]);
    expect(options.hasUnassigned).toBe(true);
    expect(options.hasNoEpic).toBe(true);
  });
});
