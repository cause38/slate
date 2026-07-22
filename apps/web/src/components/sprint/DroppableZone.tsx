"use client";

import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

type DroppableZoneProps = {
  id: string;
  /** 이 존에 드롭 시 이슈가 배정될 sprint_id (백로그는 null) */
  sprintId: string | null;
  children: React.ReactNode;
  className?: string;
};

export function DroppableZone({ id, sprintId, children, className }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { sprintId } });
  return (
    <div ref={setNodeRef} className={cn("transition-colors", isOver && "bg-primary/5", className)}>
      {children}
    </div>
  );
}
