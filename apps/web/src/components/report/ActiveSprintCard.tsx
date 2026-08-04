import { StatLine } from "@/components/report/StatLine";
import { formatDateRange } from "@/lib/date";
import type { SprintReport } from "@/lib/sprint-report";
import { cn } from "@/lib/utils";

type ActiveSprintCardProps = {
  report: SprintReport;
  bigMode: boolean;
};

export function ActiveSprintCard({ report, bigMode }: ActiveSprintCardProps) {
  const { sprint, planPoints, donePoints, planCount, doneCount } = report;
  const pct = planPoints > 0 ? Math.round((donePoints / planPoints) * 100) : 0;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div
            className={cn("flex items-center gap-2 text-sm font-semibold", bigMode && "text-lg")}
          >
            {sprint.name}
            <span className="rounded bg-status-in-progress/15 px-1.5 py-0.5 text-xs text-status-in-progress">
              Active
            </span>
          </div>
          <div className={cn("text-xs text-muted-foreground", bigMode && "text-sm")}>
            {formatDateRange(sprint.start_date, sprint.end_date)}
          </div>
        </div>
      </div>
      {sprint.goal && (
        <p className={cn("mb-3 text-sm text-muted-foreground", bigMode && "text-base")}>
          🎯 {sprint.goal}
        </p>
      )}
      <div className="grid grid-cols-3 gap-4">
        <StatLine label="계획 포인트" value={`${planPoints} pt`} bigMode={bigMode} />
        <StatLine label="완료 포인트" value={`${donePoints} pt`} bigMode={bigMode} />
        <StatLine label="진행률" value={`${pct}%`} bigMode={bigMode} />
      </div>
      <div className={cn("mt-3 text-xs text-muted-foreground", bigMode && "text-sm")}>
        {doneCount} / {planCount} 이슈 완료
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-status-done" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
