import { changedRanks, compareByRank, moveItem, rankAt } from "@/lib/issue-rank";
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

const order = (list: BoardIssue[]) => list.map((i) => i.id);

describe("rankAt", () => {
  it("사전순과 숫자순이 일치한다", () => {
    const ranks = Array.from({ length: 12 }, (_, i) => rankAt(i));
    expect([...ranks].sort()).toEqual(ranks);
  });

  it("자릿수가 늘어도 순서가 뒤집히지 않는다", () => {
    // 0 패딩이 없으면 "10000" < "9000" 이 되어 순서가 깨진다
    expect(rankAt(8) < rankAt(9)).toBe(true);
    expect(rankAt(98) < rankAt(99)).toBe(true);
  });
});

describe("compareByRank", () => {
  it("rank 가 있는 이슈가 없는 이슈보다 앞선다", () => {
    const ranked = issue({ id: "a", rank: rankAt(5) });
    const unranked = issue({ id: "b", rank: null });
    expect([unranked, ranked].sort(compareByRank)).toEqual([ranked, unranked]);
  });

  it("rank 가 같으면 원래 순서를 유지한다", () => {
    const first = issue({ id: "a", rank: null });
    const second = issue({ id: "b", rank: null });
    expect(order([first, second].sort(compareByRank))).toEqual(["a", "b"]);
  });
});

describe("moveItem", () => {
  it("아래로 옮긴다", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("위로 옮긴다", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("원본을 바꾸지 않는다", () => {
    const list = ["a", "b", "c"];
    moveItem(list, 0, 2);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("changedRanks", () => {
  it("rank 가 실제로 바뀌는 행만 돌려준다", () => {
    const list = [
      issue({ id: "a", rank: rankAt(0) }),
      issue({ id: "b", rank: rankAt(1) }),
      issue({ id: "c", rank: "엉뚱한값" }),
    ];
    expect(changedRanks(list)).toEqual([{ id: "c", rank: rankAt(2) }]);
  });

  it("rank 가 전부 null 이면 전체를 부여한다", () => {
    const list = [issue({ id: "a" }), issue({ id: "b" })];
    expect(changedRanks(list).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("순서 변경 후 다시 정렬하면 옮긴 순서가 유지된다", () => {
  it("세 번째를 맨 앞으로 옮긴다", () => {
    const list = [issue({ id: "a" }), issue({ id: "b" }), issue({ id: "c" })];
    const reordered = moveItem(list, 2, 0);
    const ranks = new Map(changedRanks(reordered).map((r) => [r.id, r.rank]));
    const saved = list.map((i) => ({ ...i, rank: ranks.get(i.id) ?? i.rank }));

    // 서버가 rank 순으로 다시 내려준 것과 같은 결과여야 한다
    expect(order(saved.sort(compareByRank))).toEqual(["c", "a", "b"]);
  });

  it("이미 rank 가 있는 목록에서 한 칸만 내려도 순서가 맞는다", () => {
    const list = [
      issue({ id: "a", rank: rankAt(0) }),
      issue({ id: "b", rank: rankAt(1) }),
      issue({ id: "c", rank: rankAt(2) }),
    ];
    const reordered = moveItem(list, 0, 1);
    const ranks = new Map(changedRanks(reordered).map((r) => [r.id, r.rank]));
    const saved = list.map((i) => ({ ...i, rank: ranks.get(i.id) ?? i.rank }));

    expect(order(saved.sort(compareByRank))).toEqual(["b", "a", "c"]);
  });
});
