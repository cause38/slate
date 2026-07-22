"use client";

import { IssueCard } from "@/components/board/IssueCard";
import { StatusPill } from "@/components/issue/StatusPill";
import type { IssueStatus } from "@/lib/constants";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

type ColumnProps = {
  status: IssueStatus;
  issues: BoardIssue[];
};

export function Column({ status, issues }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex min-h-0 flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <span className="text-xs text-muted-foreground">{issues.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition-colors ${
          isOver ? "bg-muted/60" : ""
        }`}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
