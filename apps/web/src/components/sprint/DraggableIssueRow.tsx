"use client";

import { IssueRow } from "@/components/issue/IssueRow";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type DraggableIssueRowProps = {
  issue: BoardIssue;
};

export function DraggableIssueRow({ issue }: DraggableIssueRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { issue },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
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
