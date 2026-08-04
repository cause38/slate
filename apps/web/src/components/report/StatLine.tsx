import { cn } from "@/lib/utils";

type StatLineProps = {
  label: string;
  value: string;
  bigMode: boolean;
};

export function StatLine({ label, value, bigMode }: StatLineProps) {
  return (
    <div>
      <div className={cn("text-xs text-muted-foreground", bigMode && "text-sm")}>{label}</div>
      <div className={cn("font-semibold", bigMode && "text-xl")}>{value}</div>
    </div>
  );
}
