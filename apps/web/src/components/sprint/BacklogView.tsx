"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import { IssueFilterBar } from "@/components/shared/IssueFilterBar";
import { CompleteSprintDialog } from "@/components/sprint/CompleteSprintDialog";
import { CreateSprintDialog } from "@/components/sprint/CreateSprintDialog";
import {
  DRAG_ACTIVATION_DISTANCE,
  DraggableIssueRow,
  NO_DROP_TARGET_HINT,
} from "@/components/sprint/DraggableIssueRow";
import { DroppableZone } from "@/components/sprint/DroppableZone";
import { InlineCreateIssue } from "@/components/sprint/InlineCreateIssue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/date";
import { pointerFirstCollision } from "@/lib/dnd";
import {
  EMPTY_FILTERS,
  type FilterDimension,
  activeFilterCount,
  deriveFilterOptions,
  filterIssues,
} from "@/lib/issue-filters";
import { moveItem } from "@/lib/issue-rank";
import {
  type BoardIssue,
  useProjectIssues,
  useReorderIssues,
  useUpdateIssueSprint,
} from "@/lib/queries/board-issues";
import { type Sprint, useSprints, useStartSprint } from "@/lib/queries/sprints";
import { useIsAdmin } from "@/lib/queries/users";
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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type BacklogViewProps = {
  projectId: string;
};

const BACKLOG_ZONE = "backlog";

// 스프린트=그룹축이라 필터에서 제외, 나머지 5차원 중 상태 포함
const BACKLOG_FILTER_DIMENSIONS: FilterDimension[] = [
  "types",
  "statuses",
  "assigneeIds",
  "epicIds",
  "labelIds",
];

function sumPoints(issues: BoardIssue[]) {
  return issues.reduce((total, issue) => total + (issue.story_points ?? 0), 0);
}

export function BacklogView({ projectId }: BacklogViewProps) {
  const { data: sprints, isError: sprintsFailed } = useSprints(projectId);
  const { data: issues } = useProjectIssues(projectId);
  const startSprint = useStartSprint(projectId);
  const updateSprint = useUpdateIssueSprint(projectId);
  const reorder = useReorderIssues(projectId);
  // 스프린트 생성·시작·마감은 Admin 전용(PRD 2장 권한표, rls_policies.sql:57).
  // 지금까지 버튼이 모두에게 보여서, 멤버가 눌러도 아무 일이 안 일어났다.
  const isAdmin = useIsAdmin();
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null);
  const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const options = useMemo(() => deriveFilterOptions(issues ?? []), [issues]);
  const filtered = useMemo(() => filterIssues(issues ?? [], filters), [issues, filters]);
  const hasActiveFilters = activeFilterCount(filters) > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor),
  );

  const activeSprint = sprints?.find((s) => s.status === "active") ?? null;
  const plannedSprints = sprints?.filter((s) => s.status === "planned") ?? [];
  // 스프린트가 하나도 없으면 드롭 존이 백로그뿐이라 어떤 드래그도 제자리로 끝난다.
  // 끌리기는 하는데 아무 일도 안 일어나는 상태를 만들지 않으려고 아예 막는다.
  // 로딩·실패·성공을 한 플래그로 접으면 실패를 "없다"고 잘못 알리거나, 잠깐 열렸다
  // 닫히는 창이 생겨 그 사이 시작한 드래그가 조용히 no-op 이 된다. 이유를 그대로 들고 다닌다.
  const sprintsKnown = sprints !== undefined;
  const hasDropTarget = activeSprint !== null || plannedSprints.length > 0;
  const dragBlockedReason = !sprintsKnown
    ? sprintsFailed
      ? "스프린트를 불러오지 못했어요"
      : "스프린트를 불러오는 중이에요"
    : hasDropTarget
      ? undefined
      : isAdmin
        ? NO_DROP_TARGET_HINT
        : "관리자가 스프린트를 만들면 이슈를 옮길 수 있어요";

  // 표시용 그룹핑은 필터된 목록 기준
  const issuesInSprint = (sprintId: string) => filtered.filter((i) => i.sprint_id === sprintId);
  const activeIssues = activeSprint ? issuesInSprint(activeSprint.id) : [];
  const backlogIssues = filtered.filter((i) => i.sprint_id === null);
  const activeDone = activeIssues.filter((i) => i.status === "done");
  // 스프린트 마감 캐리오버는 필터와 무관하게 실제 미완료 이슈 수를 써야 함
  const activeSprintAll = activeSprint
    ? (issues?.filter((i) => i.sprint_id === activeSprint.id) ?? [])
    : [];
  const incompleteCount = activeSprintAll.filter((i) => i.status !== "done").length;

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

    const dragged = active.data.current?.issue as BoardIssue | undefined;
    if (!dragged) return;

    const overData = over.data.current;
    const overIssue = overData?.issue as BoardIssue | undefined;
    // 드롭 대상이 이슈 행이면 그 행이 속한 그룹, 존이면 그 존의 sprintId
    const targetSprintId = overIssue
      ? overIssue.sprint_id
      : overData && "sprintId" in overData
        ? (overData.sprintId as string | null)
        : null;

    if (dragged.sprint_id !== targetSprintId) {
      updateSprint.mutate(
        { issueId: dragged.id, sprintId: targetSprintId },
        {
          onError: (error) =>
            toast.error("이동에 실패했어요", {
              description: error instanceof Error ? error.message : undefined,
            }),
        },
      );
      return;
    }

    // 같은 그룹 안 순서 변경. 필터가 걸려 있어도 어긋나지 않게 전체 목록 기준으로 옮긴다.
    if (!overIssue || overIssue.id === dragged.id) return;
    const group = (issues ?? []).filter((i) => i.sprint_id === targetSprintId);
    const from = group.findIndex((i) => i.id === dragged.id);
    const to = group.findIndex((i) => i.id === overIssue.id);
    if (from < 0 || to < 0) return;
    reorder.mutate(moveItem(group, from, to), {
      onError: (error) =>
        toast.error("순서 저장에 실패했어요", {
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveIssue((event.active.data.current?.issue as BoardIssue | undefined) ?? null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveIssue(null)}
    >
      <div className="flex flex-1 flex-col bg-background">
        <IssueFilterBar
          filters={filters}
          onChange={setFilters}
          options={options}
          dimensions={BACKLOG_FILTER_DIMENSIONS}
        />
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
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompleteTarget(activeSprint)}
                  >
                    스프린트 마감
                  </Button>
                )}
              </div>
              <div className="min-h-12 divide-y">
                {activeIssues.length ? (
                  <SortableContext
                    items={activeIssues.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeIssues.map((issue) => (
                      <DraggableIssueRow
                        key={issue.id}
                        issue={issue}
                        disabledReason={dragBlockedReason}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                    {hasActiveFilters
                      ? "필터에 맞는 이슈가 없어요. 필터를 조정해보세요."
                      : "백로그 이슈를 여기로 드래그해 스프린트를 채워요"}
                  </div>
                )}
              </div>
            </section>
          </DroppableZone>
        ) : !sprintsKnown ? (
          sprintsFailed && (
            <section className="border-b bg-card px-5 py-4 text-sm text-muted-foreground">
              스프린트를 불러오지 못했어요. 새로고침해 주세요.
            </section>
          )
        ) : (
          <section className="border-b bg-card px-5 py-4 text-sm text-muted-foreground">
            진행 중인 스프린트가 없어요.
            {plannedSprints.length > 0
              ? isAdmin
                ? " 예정 스프린트를 시작하거나 새 스프린트를 만들어보세요."
                : " 관리자가 예정 스프린트를 시작하면 보드가 열려요."
              : isAdmin
                ? ` ${NO_DROP_TARGET_HINT}.`
                : " 관리자가 스프린트를 만들면 여기에 표시돼요."}
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
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStart(sprint.id)}
                      disabled={startSprint.isPending || activeSprint !== null}
                    >
                      시작
                    </Button>
                  )}
                </div>
                {sprintIssues.length > 0 && (
                  <div className="divide-y">
                    <SortableContext
                      items={sprintIssues.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sprintIssues.map((issue) => (
                        <DraggableIssueRow
                          key={issue.id}
                          issue={issue}
                          disabledReason={dragBlockedReason}
                        />
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
              {isAdmin && (
                <CreateSprintDialog projectId={projectId} nextNumber={(sprints?.length ?? 0) + 1} />
              )}
            </div>
            <InlineCreateIssue projectId={projectId} />
            <div className="divide-y">
              {backlogIssues.length ? (
                <SortableContext
                  items={backlogIssues.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {backlogIssues.map((issue) => (
                    <DraggableIssueRow
                      key={issue.id}
                      issue={issue}
                      disabledReason={dragBlockedReason}
                    />
                  ))}
                </SortableContext>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "필터에 맞는 이슈가 없어요. 필터를 조정해보세요."
                    : "백로그가 비어 있어요. 위 입력창이나 C로 이슈를 만들어보세요."}
                </div>
              )}
            </div>
          </section>
        </DroppableZone>
      </div>

      {/* 낙관적 업데이트로 목록이 이미 새 순서라, 오버레이가 옛 자리로 날아가는 기본
          드롭 애니메이션(250ms)은 행이 올라갔다 내려오는 것처럼 보이기만 한다. 끈다. */}
      <DragOverlay dropAnimation={null}>
        {/* 포인터가 드래그 내내 오버레이 안에 있어 hover 가 계속 걸린다. pointer-events-none
            로 빼야 의도한 카드 색이 보이고 제목 밑줄도 안 생긴다. 충돌 판정은 rect 기반이라
            드롭에는 영향이 없다. */}
        {activeIssue && (
          <div className="pointer-events-none overflow-hidden rounded-md border bg-card shadow-lg">
            {/* 원본 행의 그립(-m-1.5 적용 후 16px)만큼 자리를 채워 집는 순간 내용이 밀리지 않게 한다 */}
            <IssueRow issue={activeIssue} leading={<span className="h-4 w-4 shrink-0" />} />
          </div>
        )}
      </DragOverlay>

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
