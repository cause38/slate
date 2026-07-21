import { cn } from "@/lib/utils";

type MetaRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

/** 이슈 상세 우측 메타 패널의 라벨-값 한 줄 */
export function MetaRow({ label, children, className }: MetaRowProps) {
  return (
    <div className={cn("flex min-h-8 items-center justify-between gap-2 text-sm", className)}>
      <div className="shrink-0 text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center">{children}</div>
    </div>
  );
}
