import type { BoardIssue } from "@/lib/queries/board-issues";

// issues.rank 는 text 라 사전순으로 정렬된다. 고정 자릿수 0 패딩 정수를 쓰면
// 사전순과 숫자순이 일치해서 별도 변환 없이 .order("rank") 가 그대로 먹는다.
const RANK_WIDTH = 9;
const RANK_GAP = 1000;

/** 목록에서 index 번째 자리의 rank 문자열 */
export function rankAt(index: number): string {
  return String((index + 1) * RANK_GAP).padStart(RANK_WIDTH, "0");
}

/**
 * 서버 정렬(.order("rank", { nullsFirst: false }))과 같은 순서.
 * 같은 rank 끼리는 원래 순서를 유지해야 해서 0 을 돌려준다(Array.sort 는 안정 정렬).
 */
export function compareByRank(a: BoardIssue, b: BoardIssue): number {
  if (a.rank === b.rank) return 0;
  if (a.rank === null) return 1;
  if (b.rank === null) return -1;
  return a.rank < b.rank ? -1 : 1;
}

/** 새 순서에서 rank 가 실제로 바뀌는 이슈만 추린다 */
export function changedRanks(ordered: BoardIssue[]): { id: string; rank: string }[] {
  return ordered
    .map((issue, index) => ({ id: issue.id, rank: rankAt(index), previous: issue.rank }))
    .filter((row) => row.rank !== row.previous)
    .map(({ id, rank }) => ({ id, rank }));
}

/** from 위치의 항목을 to 위치로 옮긴 새 배열 */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}
