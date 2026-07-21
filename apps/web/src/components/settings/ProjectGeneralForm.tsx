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
import { Input } from "@/components/ui/input";
import { COLOR_PRESETS } from "@/lib/constants";
import { type Project, useUpdateProject } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ProjectGeneralFormProps = {
  project: Pick<Project, "id" | "key" | "name" | "color" | "is_archived">;
};

export function ProjectGeneralForm({ project }: ProjectGeneralFormProps) {
  const update = useUpdateProject();
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const dirty = name.trim() !== project.name || color !== project.color;

  async function handleSave() {
    if (!dirty || !name.trim()) return;
    try {
      await update.mutateAsync({ id: project.id, patch: { name: name.trim(), color } });
      toast.success("저장됐어요");
      router.refresh();
    } catch (error) {
      toast.error("저장에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleArchive() {
    try {
      await update.mutateAsync({ id: project.id, patch: { is_archived: !project.is_archived } });
      toast.success(project.is_archived ? "아카이브를 해제했어요" : "프로젝트를 아카이브했어요");
      setArchiveOpen(false);
      router.push("/");
    } catch (error) {
      toast.error("처리에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <span className="mb-1 block text-sm font-medium">키</span>
          <div className="inline-flex items-center rounded-md border bg-muted px-2.5 py-1.5 font-mono text-sm text-muted-foreground">
            {project.key}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">키는 영구 불변이에요.</p>
        </div>

        <div>
          <label htmlFor="settings-name" className="mb-1 block text-sm font-medium">
            이름
          </label>
          <Input
            id="settings-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="max-w-xs"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">색상</span>
          <div className="flex items-center gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`색상 ${preset}`}
                onClick={() => setColor(preset)}
                className={cn(
                  "h-6 w-6 rounded-full border-2",
                  color === preset ? "border-foreground" : "border-transparent",
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>

        <Button size="sm" onClick={handleSave} disabled={!dirty || update.isPending}>
          저장
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-card p-4">
        <div>
          <div className="text-sm font-medium">프로젝트 아카이브</div>
          <p className="text-xs text-muted-foreground">
            아카이브하면 읽기 전용이 되고 새 이슈를 만들 수 없어요.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
          {project.is_archived ? "아카이브 해제" : "아카이브"}
        </Button>
      </div>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {project.name} {project.is_archived ? "아카이브 해제" : "아카이브"}
            </DialogTitle>
            <DialogDescription>
              {project.is_archived
                ? "아카이브를 해제하면 프로젝트 목록에 다시 표시되고 이슈를 만들 수 있어요."
                : "아카이브하면 프로젝트 목록에서 숨겨지고 읽기 전용이 됩니다. 언제든 되돌릴 수 있어요."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)}>
              취소
            </Button>
            <Button onClick={handleArchive} disabled={update.isPending}>
              {update.isPending ? "처리 중…" : project.is_archived ? "아카이브 해제" : "아카이브"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
