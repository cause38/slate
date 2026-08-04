"use client";

import { ActiveSprintCard } from "@/components/report/ActiveSprintCard";
import { CompletedSprintCard } from "@/components/report/CompletedSprintCard";
import { VelocityChart } from "@/components/report/VelocityChart";
import { Button } from "@/components/ui/button";
import { useProjectIssues } from "@/lib/queries/board-issues";
import { useSprints } from "@/lib/queries/sprints";
import { VELOCITY_WINDOW, buildSprintReports } from "@/lib/sprint-report";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { useMemo, useState } from "react";

type ReportsViewProps = {
  projectId: string;
};

export function ReportsView({ projectId }: ReportsViewProps) {
  const { data: sprints, isPending: sprintsPending } = useSprints(projectId);
  const { data: issues, isPending: issuesPending } = useProjectIssues(projectId);
  const [bigMode, setBigMode] = useState(false);

  const reports = useMemo(() => buildSprintReports(sprints ?? [], issues ?? []), [sprints, issues]);

  if (sprintsPending || issuesPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-6 p-6", bigMode && "max-w-5xl text-base")}>
      <div className="flex items-center justify-between">
        <h1 className={cn("text-lg font-semibold", bigMode && "text-2xl")}>스프린트 리포트</h1>
        <Button variant="outline" size="sm" onClick={() => setBigMode((v) => !v)}>
          {bigMode ? (
            <Minimize2 className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="mr-1 h-3.5 w-3.5" />
          )}
          {bigMode ? "일반 모드" : "회고 모드"}
        </Button>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <div className={cn("mb-3 text-sm font-medium", bigMode && "text-lg")}>
          벨로시티 (최근 {VELOCITY_WINDOW}개 완료 스프린트)
        </div>
        <VelocityChart data={reports.velocity} bigMode={bigMode} />
      </section>

      {reports.active && <ActiveSprintCard report={reports.active} bigMode={bigMode} />}

      <section className="space-y-3">
        <div className={cn("text-sm font-medium", bigMode && "text-lg")}>완료된 스프린트</div>
        {reports.completed.length ? (
          reports.completed.map((report) => (
            <CompletedSprintCard key={report.sprint.id} report={report} bigMode={bigMode} />
          ))
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            아직 완료된 스프린트가 없어요.
          </p>
        )}
      </section>
    </div>
  );
}
