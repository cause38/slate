import { Badge } from "@/components/ui/badge";
import { ISSUE_STATUS_LABELS, type IssueStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

// 상태 의미 색은 globals.css의 --status-* 시맨틱 토큰으로 (라이트/다크 대응)
const STATUS_CLASSES: Record<IssueStatus, string> = {
  todo: "bg-status-todo/15 text-status-todo border-status-todo/25",
  in_progress: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/25",
  in_review: "bg-status-in-review/15 text-status-in-review border-status-in-review/25",
  done: "bg-status-done/15 text-status-done border-status-done/25",
};

type StatusPillProps = {
  status: IssueStatus;
  className?: string;
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <Badge variant="outline" className={cn("rounded-full", STATUS_CLASSES[status], className)}>
      {ISSUE_STATUS_LABELS[status]}
    </Badge>
  );
}
