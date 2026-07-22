import { LabelBadge } from "@/components/issue/LabelBadge";
import { StatusPill } from "@/components/issue/StatusPill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BoardIssue } from "@/lib/queries/board-issues";
import Link from "next/link";

type IssueRowProps = {
  issue: BoardIssue;
  /** 드래그 핸들 등 좌측 슬롯 (백로그 W3-3) */
  leading?: React.ReactNode;
};

export function IssueRow({ issue, leading }: IssueRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-muted">
      {leading}
      <StatusPill status={issue.status} />
      <Link
        href={`/i/${issue.key}`}
        className="w-20 shrink-0 font-mono text-xs text-muted-foreground hover:underline"
      >
        {issue.key}
      </Link>
      <Link href={`/i/${issue.key}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
        {issue.title}
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {issue.labels.slice(0, 2).map((label) => (
          <LabelBadge key={label.id} name={label.name} color={label.color} />
        ))}
      </div>
      {issue.story_points !== null && (
        <Badge variant="outline" className="rounded-full">
          {issue.story_points} pt
        </Badge>
      )}
      <Avatar className="h-6 w-6">
        <AvatarImage src={issue.assignee?.avatar_url ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {issue.assignee?.name.slice(0, 1) ?? "—"}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
