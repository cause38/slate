import type { BoardIssue } from "@/lib/queries/board-issues";

export type EpicSummary = {
  epic: BoardIssue;
  children: BoardIssue[];
  doneCount: number;
  totalCount: number;
  donePoints: number;
  totalPoints: number;
};

function sumPoints(issues: BoardIssue[]): number {
  return issues.reduce((total, issue) => total + (issue.story_points ?? 0), 0);
}

/**
 * 프로젝트 이슈 전체에서 에픽별 진행률을 만든다 (PRD 3.2: 소속 이슈 목록 + 완료/전체).
 * 에픽 자신은 자식으로 세지 않는다. 소속 이슈가 없는 에픽도 목록에는 남긴다 —
 * 방금 만든 에픽이 화면에서 사라지면 만들어진 건지 알 수 없다.
 */
export function buildEpicSummaries(issues: BoardIssue[]): EpicSummary[] {
  const childrenByEpic = new Map<string, BoardIssue[]>();
  for (const issue of issues) {
    if (!issue.epic_id || issue.epic_id === issue.id) continue;
    const list = childrenByEpic.get(issue.epic_id);
    if (list) list.push(issue);
    else childrenByEpic.set(issue.epic_id, [issue]);
  }

  return issues
    .filter((issue) => issue.type === "epic")
    .map((epic) => {
      const children = childrenByEpic.get(epic.id) ?? [];
      const done = children.filter((child) => child.status === "done");
      return {
        epic,
        children,
        doneCount: done.length,
        totalCount: children.length,
        donePoints: sumPoints(done),
        totalPoints: sumPoints(children),
      };
    });
}

/** 진행률 퍼센트 (소속 이슈가 없으면 0). 막대 너비와 라벨이 같은 값을 쓰게 한 곳에 둔다 */
export function progressPercent(summary: EpicSummary): number {
  if (summary.totalCount === 0) return 0;
  return Math.round((summary.doneCount / summary.totalCount) * 100);
}
