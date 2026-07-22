"use client";

import { LabelBadge } from "@/components/issue/LabelBadge";
import { TypePill } from "@/components/issue/TypePill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BoardIssue } from "@/lib/queries/board-issues";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";

type IssueCardProps = {
  issue: BoardIssue;
  /** DragOverlay에서 렌더될 땐 sortable 훅을 붙이지 않음 */
  overlay?: boolean;
};

export function IssueCard({ issue, overlay }: IssueCardProps) {
  const router = useRouter();
  const sortable = useSortable({ id: issue.id, data: { status: issue.status } });
  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      };

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      {...(overlay ? {} : sortable.attributes)}
      {...(overlay ? {} : sortable.listeners)}
      // 8px 미만 이동은 드래그로 인식되지 않아 클릭으로 처리됨 → 상세 열기
      onClick={overlay ? undefined : () => router.push(`/i/${issue.key}`)}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-2.5 shadow-sm active:cursor-grabbing",
        sortable.isDragging && !overlay && "opacity-40",
        overlay && "shadow-lg",
      )}
    >
      <div className="mb-1 font-mono text-[11px] text-muted-foreground">{issue.key}</div>
      <div className="mb-2 text-sm leading-snug">{issue.title}</div>
      {issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypePill type={issue.type} />
          {issue.story_points !== null && (
            <Badge variant="outline" className="rounded-full">
              {issue.story_points} pt
            </Badge>
          )}
        </div>
        <Avatar className="h-5 w-5">
          <AvatarImage src={issue.assignee?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[9px]">
            {issue.assignee?.name.slice(0, 1) ?? "—"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
