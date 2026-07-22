"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDays, formatDateColumn } from "@/lib/date";
import { useCreateSprint } from "@/lib/queries/sprints";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CreateSprintDialogProps = {
  projectId: string;
  /** 자동 이름 번호 (기존 스프린트 수 + 1) */
  nextNumber: number;
};

export function CreateSprintDialog({ projectId, nextNumber }: CreateSprintDialogProps) {
  const createSprint = useCreateSprint(projectId);
  const [open, setOpen] = useState(false);

  // 기본값: 오늘 시작, 2주(13일 후 종료)
  const today = new Date();
  const defaultStart = formatDateColumn(today);
  const defaultEnd = formatDateColumn(addDays(today, 13));

  const [name, setName] = useState(`Sprint ${nextNumber}`);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [goal, setGoal] = useState("");

  // 열릴 때 최신 번호로 기본 이름 리셋 (sprints 로드가 마운트보다 늦을 수 있음)
  useEffect(() => {
    if (open) setName(`Sprint ${nextNumber}`);
  }, [open, nextNumber]);

  async function handleCreate() {
    if (!name.trim() || !startDate || !endDate) return;
    if (endDate < startDate) {
      toast.error("종료일이 시작일보다 빠를 수 없어요");
      return;
    }
    try {
      await createSprint.mutateAsync({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        goal: goal.trim() || null,
      });
      toast.success(`${name.trim()} 생성됨`);
      setOpen(false);
    } catch (error) {
      toast.error("스프린트 생성에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">＋ 새 스프린트</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>새 스프린트</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="sprint-name" className="mb-1 block text-sm font-medium">
              이름
            </label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="sprint-start" className="mb-1 block text-sm font-medium">
                시작일
              </label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="sprint-end" className="mb-1 block text-sm font-medium">
                종료일
              </label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="sprint-goal" className="mb-1 block text-sm font-medium">
              목표 (선택)
            </label>
            <Textarea
              id="sprint-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={createSprint.isPending}>
            {createSprint.isPending ? "생성 중…" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
