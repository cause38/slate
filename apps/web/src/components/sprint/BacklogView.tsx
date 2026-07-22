"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import { CompleteSprintDialog } from "@/components/sprint/CompleteSprintDialog";
import { CreateSprintDialog } from "@/components/sprint/CreateSprintDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/date";
import { type BoardIssue, useProjectIssues } from "@/lib/queries/board-issues";
import { type Sprint, useSprints, useStartSprint } from "@/lib/queries/sprints";
import { useState } from "react";
import { toast } from "sonner";

type BacklogViewProps = {
  projectId: string;
};

function sumPoints(issues: BoardIssue[]) {
  return issues.reduce((total, issue) => total + (issue.story_points ?? 0), 0);
}

export function BacklogView({ projectId }: BacklogViewProps) {
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useProjectIssues(projectId);
  const startSprint = useStartSprint(projectId);
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null);

  const activeSprint = sprints?.find((s) => s.status === "active") ?? null;
  const plannedSprints = sprints?.filter((s) => s.status === "planned") ?? [];

  const activeIssues = issues?.filter((i) => i.sprint_id === activeSprint?.id) ?? [];
  const backlogIssues = issues?.filter((i) => i.sprint_id === null) ?? [];
  const activeDone = activeIssues.filter((i) => i.status === "done");
  const incompleteCount = activeIssues.length - activeDone.length;

  function handleStart(sprintId: string) {
    startSprint.mutate(sprintId, {
      onError: (error) => {
        // unique_violation(23505) = 이미 active 스프린트 존재 (idx_sprints_one_active)
        const isDuplicate =
          typeof error === "object" && error !== null && "code" in error && error.code === "23505";
        toast.error("스프린트를 시작할 수 없어요", {
          description: isDuplicate
            ? "이미 진행 중인 스프린트가 있어요"
            : error instanceof Error
              ? error.message
              : undefined,
        });
      },
    });
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Active 스프린트 */}
      {activeSprint ? (
        <section className="border-b bg-card">
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {activeSprint.name}
                <Badge className="bg-status-in-progress/15 text-status-in-progress">Active</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateRange(activeSprint.start_date, activeSprint.end_date)} ·{" "}
                {sumPoints(activeDone)} / {sumPoints(activeIssues)} pt · {activeIssues.length} 이슈
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCompleteTarget(activeSprint)}>
              스프린트 마감
            </Button>
          </div>
          <div className="divide-y">
            {activeIssues.length ? (
              activeIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
            ) : (
              <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                백로그에서 이슈를 여기로 옮겨 스프린트를 채워요 (드래그는 W3-3)
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="flex items-center justify-between border-b bg-card px-5 py-4">
          <div className="text-sm text-muted-foreground">
            진행 중인 스프린트가 없어요.
            {plannedSprints.length > 0 && " 예정 스프린트를 시작하거나"}
            {" 새 스프린트를 만들어보세요."}
          </div>
        </section>
      )}

      {/* 예정 스프린트 */}
      {plannedSprints.length > 0 && (
        <section className="border-b bg-card/50">
          {plannedSprints.map((sprint) => (
            <div key={sprint.id} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {sprint.name}
                <Badge variant="secondary">예정</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateRange(sprint.start_date, sprint.end_date)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStart(sprint.id)}
                disabled={startSprint.isPending || activeSprint !== null}
              >
                시작
              </Button>
            </div>
          ))}
        </section>
      )}

      {/* 백로그 */}
      <section className="flex-1">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <div className="text-sm font-semibold">백로그</div>
            <div className="text-xs text-muted-foreground">
              {backlogIssues.length} 이슈 · {sumPoints(backlogIssues)} pt
            </div>
          </div>
          <CreateSprintDialog projectId={projectId} nextNumber={(sprints?.length ?? 0) + 1} />
        </div>
        <div className="divide-y">
          {backlogIssues.length ? (
            backlogIssues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              백로그가 비어 있어요. C를 눌러 이슈를 만들어보세요.
            </div>
          )}
        </div>
      </section>

      {completeTarget && (
        <CompleteSprintDialog
          projectId={projectId}
          sprintId={completeTarget.id}
          sprintName={completeTarget.name}
          incompleteCount={incompleteCount}
          open={completeTarget !== null}
          onOpenChange={(open) => !open && setCompleteTarget(null)}
        />
      )}
    </div>
  );
}
