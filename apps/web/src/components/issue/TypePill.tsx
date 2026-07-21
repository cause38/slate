import { Badge } from "@/components/ui/badge";
import { ISSUE_TYPE_LABELS, type IssueType } from "@/lib/constants";
import { cn } from "@/lib/utils";

// 디자인 핸드오프 3.2 타입 컬러
const TYPE_CLASSES: Record<IssueType, string> = {
  story: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  task: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  bug: "bg-red-500/15 text-red-500 border-red-500/25",
  epic: "bg-purple-500/15 text-purple-500 border-purple-500/25",
};

type TypePillProps = {
  type: IssueType;
  className?: string;
};

export function TypePill({ type, className }: TypePillProps) {
  return (
    <Badge variant="outline" className={cn(TYPE_CLASSES[type], className)}>
      {ISSUE_TYPE_LABELS[type]}
    </Badge>
  );
}
