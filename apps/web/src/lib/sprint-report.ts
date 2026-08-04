import type { BoardIssue } from "@/lib/queries/board-issues";
import type { Sprint } from "@/lib/queries/sprints";

// 완료 스프린트는 done 이슈의 sprint_id가 유지되므로 완료 포인트(=벨로시티)는 정확.
// 미완료는 완료 시 이동해 계획-대비-실제 정밀 복원은 불가(스냅샷은 2단계).
// active 스프린트는 현재 이슈로 실시간 계획 대비 실제를 보여준다.

export type SprintReport = {
  sprint: Sprint;
  planPoints: number;
  donePoints: number;
  planCount: number;
  doneCount: number;
  doneIssues: BoardIssue[];
};

export type VelocityPoint = { name: string; points: number };

export type SprintReportsData = {
  active: SprintReport | null;
  completed: SprintReport[]; // 최신 완료 우선
  velocity: VelocityPoint[]; // 최근 N개 완료, 시간순(오래된→최신)
};

/** 벨로시티 차트에 표시할 최근 완료 스프린트 개수 */
export const VELOCITY_WINDOW = 5;

function sumPoints(issues: BoardIssue[]): number {
  return issues.reduce((total, issue) => total + (issue.story_points ?? 0), 0);
}

function reportFor(sprint: Sprint, issues: BoardIssue[]): SprintReport {
  const inSprint = issues.filter((issue) => issue.sprint_id === sprint.id);
  const doneIssues = inSprint.filter((issue) => issue.status === "done");
  return {
    sprint,
    planPoints: sumPoints(inSprint),
    donePoints: sumPoints(doneIssues),
    planCount: inSprint.length,
    doneCount: doneIssues.length,
    doneIssues,
  };
}

export function buildSprintReports(sprints: Sprint[], issues: BoardIssue[]): SprintReportsData {
  const active = sprints.find((sprint) => sprint.status === "active") ?? null;
  const completed = sprints
    .filter((sprint) => sprint.status === "completed")
    .sort((a, b) => b.end_date.localeCompare(a.end_date))
    .map((sprint) => reportFor(sprint, issues));

  const velocity = completed
    .slice(0, VELOCITY_WINDOW)
    .reverse()
    .map((report) => ({ name: report.sprint.name, points: report.donePoints }));

  return {
    active: active ? reportFor(active, issues) : null,
    completed,
    velocity,
  };
}
