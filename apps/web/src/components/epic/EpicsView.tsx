"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import { TypePill } from "@/components/issue/TypePill";
import { type EpicSummary, buildEpicSummaries, progressPercent } from "@/lib/epic-summary";
import { useProjectIssues } from "@/lib/queries/board-issues";
import Link from "next/link";
import { useMemo } from "react";

type EpicsViewProps = {
  projectId: string;
};

function EpicCard({ summary }: { summary: EpicSummary }) {
  const { epic, children, doneCount, totalCount, donePoints, totalPoints } = summary;
  const percent = progressPercent(summary);

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <TypePill type={epic.type} />
          <Link
            href={`/i/${epic.key}`}
            className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline"
          >
            {epic.title}
          </Link>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{epic.key}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {doneCount} / {totalCount} 이슈 · {donePoints} / {totalPoints} pt · {percent}%
          </span>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="divide-y">
          {children.map((child) => (
            <IssueRow key={child.id} issue={child} />
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center text-xs text-muted-foreground">
          아직 소속 이슈가 없어요. 이슈 상세의 에픽 항목에서 이 에픽을 골라 붙여요.
        </div>
      )}
    </section>
  );
}

export function EpicsView({ projectId }: EpicsViewProps) {
  const { data: issues, isPending } = useProjectIssues(projectId);
  const summaries = useMemo(() => buildEpicSummaries(issues ?? []), [issues]);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
        <p className="text-sm">아직 에픽이 없어요</p>
        <p className="text-xs text-muted-foreground">
          이슈를 만들고 타입을 Epic 으로 바꾸면 여기에 나타나요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-5">
      {summaries.map((summary) => (
        <EpicCard key={summary.epic.id} summary={summary} />
      ))}
    </div>
  );
}
