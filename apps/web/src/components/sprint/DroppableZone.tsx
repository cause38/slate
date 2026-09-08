"use client";

import { cn } from "@/lib/utils";
import { useDndContext, useDroppable } from "@dnd-kit/core";

type DroppableZoneProps = {
  id: string;
  /** 이 존에 드롭 시 이슈가 배정될 sprint_id (백로그는 null) */
  sprintId: string | null;
  children: React.ReactNode;
  className?: string;
};

export function DroppableZone({ id, sprintId, children, className }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { sprintId } });
  // 드래그 중에는 놓을 수 있는 곳을 전부 드러낸다. 이게 없으면 사용자는 어디로
  // 끌어야 하는지 알 수 없고, 얇은 스프린트 줄은 존재 자체가 안 보인다.
  const { active } = useDndContext();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors",
        active && "outline-1 outline-dashed outline-offset-[-2px] outline-border",
        isOver && "bg-primary/10 outline-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
