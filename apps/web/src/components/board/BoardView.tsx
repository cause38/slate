"use client";

import { Board } from "@/components/board/Board";
import { IssueFilterBar } from "@/components/shared/IssueFilterBar";
import { formatDateRange } from "@/lib/date";
import {
  EMPTY_FILTERS,
  type FilterDimension,
  deriveFilterOptions,
  filterIssues,
} from "@/lib/issue-filters";
import { useProjectIssues } from "@/lib/queries/board-issues";
import { useSprints } from "@/lib/queries/sprints";
import Link from "next/link";
import { useMemo, useState } from "react";

type BoardViewProps = {
  projectId: string;
  projectKey: string;
};

// 보드는 상태=컬럼축, 스프린트=활성 고정이라 그 두 차원은 필터에서 제외
const BOARD_FILTER_DIMENSIONS: FilterDimension[] = ["types", "assigneeIds", "epicIds", "labelIds"];

export function BoardView({ projectId, projectKey }: BoardViewProps) {
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useProjectIssues(projectId);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // 옵션은 전체 프로젝트 이슈에서 유도 — 에픽은 스프린트 밖에 있어도 선택 가능해야 함
  const options = useMemo(() => deriveFilterOptions(issues ?? []), [issues]);

  const activeSprint = sprints?.find((s) => s.status === "active") ?? null;

  if (!activeSprint) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <div className="text-sm font-medium">진행 중인 스프린트가 없어요</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          백로그에서 스프린트를 만들고 시작하면 이 보드에 칸반이 표시됩니다.
        </p>
        <Link
          href={`/projects/${projectKey}/backlog`}
          className="mt-2 text-sm text-primary hover:underline"
        >
          백로그로 이동 →
        </Link>
      </div>
    );
  }

  const sprintIssues = issues?.filter((issue) => issue.sprint_id === activeSprint.id) ?? [];
  const visibleIssues = filterIssues(sprintIssues, filters);

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-card px-4 py-2.5">
        <div className="text-sm font-semibold">{activeSprint.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatDateRange(activeSprint.start_date, activeSprint.end_date)} · {visibleIssues.length}{" "}
          이슈
        </div>
      </div>
      <IssueFilterBar
        filters={filters}
        onChange={setFilters}
        options={options}
        dimensions={BOARD_FILTER_DIMENSIONS}
      />
      <div className="min-h-0 flex-1 bg-muted/20">
        <Board projectId={projectId} issues={visibleIssues} />
      </div>
    </div>
  );
}
