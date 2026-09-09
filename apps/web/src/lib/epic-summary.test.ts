import { buildEpicSummaries, progressPercent } from "@/lib/epic-summary";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { describe, expect, it } from "vitest";

function issue(over: Partial<BoardIssue>): BoardIssue {
  return {
    id: "i-1",
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

const epic = (id: string, over: Partial<BoardIssue> = {}) =>
  issue({ id, key: id, type: "epic", title: `에픽 ${id}`, ...over });

describe("buildEpicSummaries", () => {
  it("에픽별로 소속 이슈를 모은다", () => {
    const summaries = buildEpicSummaries([
      epic("e1"),
      epic("e2"),
      issue({ id: "a", epic_id: "e1" }),
      issue({ id: "b", epic_id: "e1" }),
      issue({ id: "c", epic_id: "e2" }),
    ]);
    expect(summaries.map((s) => [s.epic.id, s.totalCount])).toEqual([
      ["e1", 2],
      ["e2", 1],
    ]);
  });

  it("소속 이슈가 없는 에픽도 목록에 남긴다", () => {
    const summaries = buildEpicSummaries([epic("e1")]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.totalCount).toBe(0);
  });

  it("완료 수와 포인트를 센다", () => {
    const [summary] = buildEpicSummaries([
      epic("e1"),
      issue({ id: "a", epic_id: "e1", status: "done", story_points: 3 }),
      issue({ id: "b", epic_id: "e1", status: "todo", story_points: 5 }),
      issue({ id: "c", epic_id: "e1", status: "done", story_points: null }),
    ]);
    expect(summary?.doneCount).toBe(2);
    expect(summary?.totalCount).toBe(3);
    expect(summary?.donePoints).toBe(3);
    expect(summary?.totalPoints).toBe(8);
  });

  it("에픽이 자기 자신을 자식으로 세지 않는다", () => {
    const [summary] = buildEpicSummaries([epic("e1", { epic_id: "e1" })]);
    expect(summary?.totalCount).toBe(0);
  });

  it("에픽 타입이 아닌 이슈는 목록에 넣지 않는다", () => {
    expect(buildEpicSummaries([issue({ id: "a" })])).toEqual([]);
  });
});

describe("progressPercent", () => {
  it("소속 이슈가 없으면 0", () => {
    const [summary] = buildEpicSummaries([epic("e1")]);
    expect(summary && progressPercent(summary)).toBe(0);
  });

  it("반올림한다", () => {
    const [summary] = buildEpicSummaries([
      epic("e1"),
      issue({ id: "a", epic_id: "e1", status: "done" }),
      issue({ id: "b", epic_id: "e1" }),
      issue({ id: "c", epic_id: "e1" }),
    ]);
    expect(summary && progressPercent(summary)).toBe(33);
  });
});
