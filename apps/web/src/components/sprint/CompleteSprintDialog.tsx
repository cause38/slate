"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type CarryOver, useCompleteSprint } from "@/lib/queries/sprints";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

type CompleteSprintDialogProps = {
  projectId: string;
  sprintId: string;
  sprintName: string;
  incompleteCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CARRY_OVER_OPTIONS: { value: CarryOver; label: string; desc: string }[] = [
  { value: "next", label: "다음 스프린트로 이동", desc: "가장 가까운 예정 스프린트로 옮겨요" },
  { value: "backlog", label: "백로그로 반환", desc: "스프린트에서 빼 백로그로 보내요" },
  { value: "keep", label: "완료 스프린트에 유지", desc: "이 스프린트에 그대로 남겨요" },
];

export function CompleteSprintDialog({
  projectId,
  sprintId,
  sprintName,
  incompleteCount,
  open,
  onOpenChange,
}: CompleteSprintDialogProps) {
  const completeSprint = useCompleteSprint(projectId);
  const [carryOver, setCarryOver] = useState<CarryOver>("next");

  async function handleComplete() {
    try {
      await completeSprint.mutateAsync({ sprintId, carryOver });
      toast.success(`${sprintName} 마감됨`);
      onOpenChange(false);
    } catch (error) {
      toast.error("스프린트 마감에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{sprintName} 마감</DialogTitle>
          <DialogDescription>
            {incompleteCount > 0
              ? `미완료 이슈 ${incompleteCount}개를 어떻게 처리할까요?`
              : "미완료 이슈가 없어요. 바로 마감할 수 있어요."}
          </DialogDescription>
        </DialogHeader>

        {incompleteCount > 0 && (
          <div className="space-y-2">
            {CARRY_OVER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCarryOver(option.value)}
                className={cn(
                  "flex w-full flex-col items-start rounded-lg border p-3 text-left transition-colors",
                  carryOver === option.value ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.desc}</span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleComplete} disabled={completeSprint.isPending}>
            {completeSprint.isPending ? "마감 중…" : "스프린트 마감"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
