"use client";

import { Board } from "@/components/board/Board";
import { formatDateRange } from "@/lib/date";
import { useProjectIssues } from "@/lib/queries/board-issues";
import { useSprints } from "@/lib/queries/sprints";
import Link from "next/link";

type BoardViewProps = {
  projectId: string;
  projectKey: string;
};

export function BoardView({ projectId, projectKey }: BoardViewProps) {
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useProjectIssues(projectId);

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

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-card px-4 py-2.5">
        <div className="text-sm font-semibold">{activeSprint.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatDateRange(activeSprint.start_date, activeSprint.end_date)} · {sprintIssues.length}{" "}
          이슈
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-muted/20">
        <Board projectId={projectId} issues={sprintIssues} />
      </div>
    </div>
  );
}
