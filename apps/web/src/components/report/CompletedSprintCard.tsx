import { formatDateRange } from "@/lib/date";
import type { SprintReport } from "@/lib/sprint-report";
import { cn } from "@/lib/utils";

type CompletedSprintCardProps = {
  report: SprintReport;
  bigMode: boolean;
};

export function CompletedSprintCard({ report, bigMode }: CompletedSprintCardProps) {
  const { sprint, donePoints, doneCount, doneIssues } = report;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className={cn("text-sm font-semibold", bigMode && "text-lg")}>{sprint.name}</div>
        <div className={cn("text-xs text-muted-foreground", bigMode && "text-sm")}>
          {formatDateRange(sprint.start_date, sprint.end_date)}
        </div>
      </div>
      {sprint.goal && (
        <p className={cn("mb-2 text-sm text-muted-foreground", bigMode && "text-base")}>
          🎯 {sprint.goal}
        </p>
      )}
      <div className={cn("mb-3 text-sm", bigMode && "text-base")}>
        완료 <span className="font-semibold">{doneCount}개</span> ·{" "}
        <span className="font-semibold">{donePoints} pt</span>
      </div>
      {doneIssues.length > 0 && (
        <ul className="divide-y rounded-md border">
          {doneIssues.map((issue) => (
            <li
              key={issue.id}
              className={cn("flex items-center gap-2 px-3 py-2 text-sm", bigMode && "text-base")}
            >
              <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
              <span className="min-w-0 flex-1 truncate">{issue.title}</span>
              {issue.story_points != null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {issue.story_points} pt
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
