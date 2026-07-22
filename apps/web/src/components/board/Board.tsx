"use client";

import { Column } from "@/components/board/Column";
import { IssueCard } from "@/components/board/IssueCard";
import { ISSUE_STATUSES, type IssueStatus, isIssueStatus } from "@/lib/constants";
import { type BoardIssue, useUpdateIssueStatus } from "@/lib/queries/board-issues";
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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { toast } from "sonner";

type BoardProps = {
  projectId: string;
  issues: BoardIssue[];
};

export function Board({ projectId, issues }: BoardProps) {
  const updateStatus = useUpdateIssueStatus(projectId);
  const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
  // 드래그 시작 임계값 8px — 카드 클릭(상세 이동)과 드래그를 구분. 키보드 드래그도 지원(a11y)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = (status: IssueStatus) => issues.filter((issue) => issue.status === status);

  function handleDragStart(event: DragStartEvent) {
    setActiveIssue(issues.find((i) => i.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    // over.id가 컬럼(status) 또는 카드(그 카드의 status)일 수 있음
    const overStatus = isIssueStatus(String(over.id))
      ? (String(over.id) as IssueStatus)
      : (over.data.current?.status as IssueStatus | undefined);
    const activeStatus = active.data.current?.status as IssueStatus | undefined;
    if (!overStatus || overStatus === activeStatus) return;

    updateStatus.mutate(
      { issueId: String(active.id), status: overStatus },
      {
        onError: (error) =>
          toast.error("상태 변경에 실패했어요", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveIssue(null)}
    >
      <div className="grid h-full grid-cols-4 gap-3 p-4">
        {ISSUE_STATUSES.map((status) => (
          <Column key={status} status={status} issues={byStatus(status)} />
        ))}
      </div>
      <DragOverlay>{activeIssue && <IssueCard issue={activeIssue} overlay />}</DragOverlay>
    </DndContext>
  );
}
