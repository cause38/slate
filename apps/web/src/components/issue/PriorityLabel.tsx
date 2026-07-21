import { ISSUE_PRIORITY_LABELS, type IssuePriority } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronsDown, ChevronsUp, Minus } from "lucide-react";

// 디자인 핸드오프 3.2 — Highest는 상향 화살표(red), Lowest는 하향(slate)
const PRIORITY_META: Record<IssuePriority, { icon: typeof Minus; className: string }> = {
  highest: { icon: ChevronsUp, className: "text-red-500" },
  high: { icon: ChevronsUp, className: "text-orange-500" },
  medium: { icon: Minus, className: "text-muted-foreground" },
  low: { icon: ChevronsDown, className: "text-sky-500" },
  lowest: { icon: ChevronsDown, className: "text-slate-400" },
};

type PriorityLabelProps = {
  priority: IssuePriority;
};

export function PriorityLabel({ priority }: PriorityLabelProps) {
  const { icon: Icon, className } = PRIORITY_META[priority];
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5", className)} />
      {ISSUE_PRIORITY_LABELS[priority]}
    </span>
  );
}
