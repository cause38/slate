import type { BoardIssue } from "@/lib/queries/board-issues";
import type { Sprint } from "@/lib/queries/sprints";
import { buildSprintReports } from "@/lib/sprint-report";
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

function sprint(over: Partial<Sprint>): Sprint {
  return {
    id: crypto.randomUUID(),
    project_id: "p",
    name: "S",
    start_date: "2026-01-01",
    end_date: "2026-01-14",
    status: "planned",
    goal: null,
    created_at: "2026-01-01T00:00:00Z",
    closed_at: null,
    ...over,
  };
}

describe("buildSprintReports", () => {
  it("완료 스프린트의 done 이슈 포인트만 벨로시티에 집계", () => {
    const s1 = sprint({ id: "s1", name: "S1", status: "completed", end_date: "2026-01-14" });
    const issues = [
      issue({ sprint_id: "s1", status: "done", story_points: 5 }),
      issue({ sprint_id: "s1", status: "done", story_points: 3 }),
      issue({ sprint_id: "s1", status: "in_progress", story_points: 8 }), // 미완료 → 제외
    ];
    const { velocity, completed } = buildSprintReports([s1], issues);
    expect(velocity).toEqual([{ name: "S1", points: 8 }]);
    expect(completed[0].doneCount).toBe(2);
    expect(completed[0].donePoints).toBe(8);
  });

  it("벨로시티는 최근 5개 완료 스프린트를 시간순(오래된→최신)으로", () => {
    const sprints = [1, 2, 3, 4, 5, 6].map((n) =>
      sprint({ id: `s${n}`, name: `S${n}`, status: "completed", end_date: `2026-0${n}-14` }),
    );
    const issues = sprints.map((s, idx) =>
      issue({ sprint_id: s.id, status: "done", story_points: idx + 1 }),
    );
    const { velocity } = buildSprintReports(sprints, issues);
    // 최신 5개(S6..S2) 중 시간순 → S2,S3,S4,S5,S6
    expect(velocity.map((v) => v.name)).toEqual(["S2", "S3", "S4", "S5", "S6"]);
    expect(velocity.map((v) => v.points)).toEqual([2, 3, 4, 5, 6]);
  });

  it("활성 스프린트는 현재 이슈로 계획 대비 실제(plan/done) 계산", () => {
    const active = sprint({ id: "a1", name: "A1", status: "active" });
    const issues = [
      issue({ sprint_id: "a1", status: "done", story_points: 2 }),
      issue({ sprint_id: "a1", status: "in_progress", story_points: 3 }),
    ];
    const { active: report } = buildSprintReports([active], issues);
    expect(report).not.toBeNull();
    expect(report?.planPoints).toBe(5);
    expect(report?.donePoints).toBe(2);
    expect(report?.planCount).toBe(2);
    expect(report?.doneCount).toBe(1);
  });

  it("완료 스프린트는 없고 활성도 없으면 빈 결과", () => {
    const { active, completed, velocity } = buildSprintReports([], []);
    expect(active).toBeNull();
    expect(completed).toEqual([]);
    expect(velocity).toEqual([]);
  });

  it("story_points null은 0으로 합산", () => {
    const s1 = sprint({ id: "s1", status: "completed" });
    const issues = [
      issue({ sprint_id: "s1", status: "done", story_points: null }),
      issue({ sprint_id: "s1", status: "done", story_points: 4 }),
    ];
    const { velocity } = buildSprintReports([s1], issues);
    expect(velocity[0].points).toBe(4);
  });
});
