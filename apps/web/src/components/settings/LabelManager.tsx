"use client";

import { LabelBadge } from "@/components/issue/LabelBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LABEL_COLOR_PRESETS,
  type LabelWithUsage,
  useCreateLabel,
  useDeleteLabel,
  useLabelsWithUsage,
} from "@/lib/queries/labels";
import { cn } from "@/lib/utils";
import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LabelManagerProps = {
  projectId: string;
};

export function LabelManager({ projectId }: LabelManagerProps) {
  const { data: labels } = useLabelsWithUsage(projectId);
  const createLabel = useCreateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LABEL_COLOR_PRESETS[0]);
  const [pendingDelete, setPendingDelete] = useState<LabelWithUsage | null>(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (labels?.some((label) => label.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("이미 있는 라벨이에요");
      return;
    }
    try {
      await createLabel.mutateAsync({ name: trimmed, color });
      setName("");
    } catch (error) {
      toast.error("라벨 생성에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteLabel.mutateAsync(pendingDelete.id);
    } catch (error) {
      toast.error("라벨 삭제에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-1">
          {LABEL_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`색상 ${preset}`}
              onClick={() => setColor(preset)}
              className={cn(
                "h-5 w-5 rounded-full border-2",
                color === preset ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleCreate();
            }
          }}
          placeholder="새 라벨 이름"
          className="h-8 w-40"
        />
        <Button size="sm" onClick={handleCreate} disabled={createLabel.isPending}>
          추가
        </Button>
      </div>

      {labels?.length ? (
        <div className="divide-y rounded-lg border bg-card">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-3 px-4 py-2.5">
              <LabelBadge name={label.name} color={label.color} />
              {label.issueCount > 0 && (
                <span className="text-xs text-muted-foreground">{label.issueCount}개 이슈</span>
              )}
              <span className="ml-auto font-mono text-xs text-muted-foreground">{label.color}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`${label.name} 삭제`}
                onClick={() => setPendingDelete(label)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <X className="mx-auto mb-1 h-4 w-4" />
          아직 라벨이 없어요
        </div>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{pendingDelete?.name} 삭제</DialogTitle>
            <DialogDescription>
              {pendingDelete && pendingDelete.issueCount > 0
                ? `이 라벨이 붙은 ${pendingDelete.issueCount}개 이슈에서 라벨이 제거됩니다. 되돌릴 수 없어요.`
                : "이 라벨을 삭제할까요? 되돌릴 수 없어요."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLabel.isPending}
            >
              {deleteLabel.isPending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
