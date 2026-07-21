import { cn } from "@/lib/utils";

type LabelBadgeProps = {
  name: string;
  color: string;
  className?: string;
};

/** 라벨은 사용자가 색을 지정하므로 inline style로 틴트 적용 (테마 토큰 예외) */
export function LabelBadge({ name, color, className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {name}
    </span>
  );
}
