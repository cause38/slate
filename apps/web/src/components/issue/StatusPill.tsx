import { Badge } from "@/components/ui/badge";
import { ISSUE_STATUS_LABELS, type IssueStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

// 디자인 핸드오프 3.2 의미 컬러 — 상태 식별용 10%
const STATUS_CLASSES: Record<IssueStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  in_review: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  done: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
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
