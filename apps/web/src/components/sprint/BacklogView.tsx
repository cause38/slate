"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import { CompleteSprintDialog } from "@/components/sprint/CompleteSprintDialog";
import { CreateSprintDialog } from "@/components/sprint/CreateSprintDialog";
import { DraggableIssueRow } from "@/components/sprint/DraggableIssueRow";
import { DroppableZone } from "@/components/sprint/DroppableZone";
import { InlineCreateIssue } from "@/components/sprint/InlineCreateIssue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/date";
import {
  type BoardIssue,
  useProjectIssues,
  useUpdateIssueSprint,
} from "@/lib/queries/board-issues";
import { type Sprint, useSprints, useStartSprint } from "@/lib/queries/sprints";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { toast } from "sonner";

type BacklogViewProps = {
  projectId: string;
};

const BACKLOG_ZONE = "backlog";

function sumPoints(issues: BoardIssue[]) {
  return issues.reduce((total, issue) => total + (issue.story_points ?? 0), 0);
}

export function BacklogView({ projectId }: BacklogViewProps) {
  const { data: sprints } = useSprints(projectId);
  const { data: issues } = useProjectIssues(projectId);
  const startSprint = useStartSprint(projectId);
  const updateSprint = useUpdateIssueSprint(projectId);
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null);
  const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeSprint = sprints?.find((s) => s.status === "active") ?? null;
  const plannedSprints = sprints?.filter((s) => s.status === "planned") ?? [];

  const issuesInSprint = (sprintId: string) =>
    issues?.filter((i) => i.sprint_id === sprintId) ?? [];
  const activeIssues = activeSprint ? issuesInSprint(activeSprint.id) : [];
  const backlogIssues = issues?.filter((i) => i.sprint_id === null) ?? [];
  const activeDone = activeIssues.filter((i) => i.status === "done");
  const incompleteCount = activeIssues.length - activeDone.length;

  function handleStart(sprintId: string) {
    startSprint.mutate(sprintId, {
      onError: (error) => {
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

  function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const overData = over.data.current;
    // 드롭 대상이 존이면 그 sprintId, 이슈 행이면 그 행의 sprint_id로 존을 유추
    const targetSprintId =
      overData && "sprintId" in overData
        ? (overData.sprintId as string | null)
        : ((overData?.issue as BoardIssue | undefined)?.sprint_id ?? null);

    const dragged = active.data.current?.issue as BoardIssue | undefined;
    if (!dragged || dragged.sprint_id === targetSprintId) return;

    updateSprint.mutate(
      { issueId: dragged.id, sprintId: targetSprintId },
      {
        onError: (error) =>
          toast.error("이동에 실패했어요", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveIssue((event.active.data.current?.issue as BoardIssue | undefined) ?? null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveIssue(null)}
    >
      <div className="flex flex-1 flex-col bg-background">
        {/* Active 스프린트 */}
        {activeSprint ? (
          <DroppableZone id={activeSprint.id} sprintId={activeSprint.id}>
            <section className="border-b bg-card">
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {activeSprint.name}
                    <Badge className="bg-status-in-progress/15 text-status-in-progress">
                      Active
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateRange(activeSprint.start_date, activeSprint.end_date)} ·{" "}
                    {sumPoints(activeDone)} / {sumPoints(activeIssues)} pt · {activeIssues.length}{" "}
                    이슈
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCompleteTarget(activeSprint)}>
                  스프린트 마감
                </Button>
              </div>
              <div className="min-h-12 divide-y">
                <SortableContext
                  items={activeIssues.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activeIssues.length ? (
                    activeIssues.map((issue) => <DraggableIssueRow key={issue.id} issue={issue} />)
                  ) : (
                    <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                      백로그 이슈를 여기로 드래그해 스프린트를 채워요
                    </div>
                  )}
                </SortableContext>
              </div>
            </section>
          </DroppableZone>
        ) : (
          <section className="border-b bg-card px-5 py-4 text-sm text-muted-foreground">
            진행 중인 스프린트가 없어요.
            {plannedSprints.length > 0 && " 예정 스프린트를 시작하거나"} 새 스프린트를 만들어보세요.
          </section>
        )}

        {/* 예정 스프린트 (각각 드롭 존) */}
        {plannedSprints.map((sprint) => {
          const sprintIssues = issuesInSprint(sprint.id);
          return (
            <DroppableZone key={sprint.id} id={sprint.id} sprintId={sprint.id}>
              <section className="border-b bg-card/50">
                <div className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    {sprint.name}
                    <Badge variant="secondary">예정</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateRange(sprint.start_date, sprint.end_date)} · {sprintIssues.length}{" "}
                      이슈 · {sumPoints(sprintIssues)} pt
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
                {sprintIssues.length > 0 && (
                  <div className="divide-y">
                    <SortableContext
                      items={sprintIssues.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sprintIssues.map((issue) => (
                        <DraggableIssueRow key={issue.id} issue={issue} />
                      ))}
                    </SortableContext>
                  </div>
                )}
              </section>
            </DroppableZone>
          );
        })}

        {/* 백로그 */}
        <DroppableZone id={BACKLOG_ZONE} sprintId={null} className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <div className="text-sm font-semibold">백로그</div>
                <div className="text-xs text-muted-foreground">
                  {backlogIssues.length} 이슈 · {sumPoints(backlogIssues)} pt
                </div>
              </div>
              <CreateSprintDialog projectId={projectId} nextNumber={(sprints?.length ?? 0) + 1} />
            </div>
            <InlineCreateIssue projectId={projectId} />
            <div className="divide-y">
              <SortableContext
                items={backlogIssues.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {backlogIssues.length ? (
                  backlogIssues.map((issue) => <DraggableIssueRow key={issue.id} issue={issue} />)
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    백로그가 비어 있어요. 위 입력창이나 C로 이슈를 만들어보세요.
                  </div>
                )}
              </SortableContext>
            </div>
          </section>
        </DroppableZone>
      </div>

      <DragOverlay>{activeIssue && <IssueRow issue={activeIssue} />}</DragOverlay>

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
    </DndContext>
  );
}
