"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type DraggableIssueRowProps = {
  issue: BoardIssue;
};

// useSortable 대신 useDraggable — 백로그는 존(sprint) 간 이동만 하고 같은 존 내
// 순서(rank)는 저장하지 않으므로, 같은 존에서 카드가 밀렸다 튕기는 정렬 피드백을 없앤다.
export function DraggableIssueRow({ issue }: DraggableIssueRowProps) {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "opacity-40" : ""}
    >
      <IssueRow
        issue={issue}
        leading={
          <button
            type="button"
            aria-label="드래그로 이동"
            className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}
