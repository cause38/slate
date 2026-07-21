"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { COLOR_PRESETS } from "@/lib/constants";
import { PROJECT_KEY_PATTERN, useCreateProject } from "@/lib/queries/projects";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLOR_PRESETS[4]);
  const router = useRouter();
  const createProject = useCreateProject();

  const keyValid = PROJECT_KEY_PATTERN.test(key);
  const canSubmit = keyValid && name.trim().length > 0;

  async function handleCreate() {
    if (!canSubmit) return;
    try {
      const project = await createProject.mutateAsync({ key, name: name.trim(), color });
      toast.success(`${project.key} 프로젝트가 생성됐어요`);
      setOpen(false);
      setKey("");
      setName("");
      router.push(`/projects/${project.key}/board`);
    } catch (error) {
      // Postgres unique_violation(23505) → 키 중복. 메시지 substring보다 code가 견고
      const isDuplicate =
        typeof error === "object" && error !== null && "code" in error && error.code === "23505";
      toast.error("프로젝트 생성에 실패했어요", {
        description: isDuplicate
          ? "이미 쓰이는 키예요"
          : error instanceof Error
            ? error.message
            : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          + 새 프로젝트
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>새 프로젝트</DialogTitle>
          <DialogDescription>키는 이슈 접두어가 되며 생성 후 바꿀 수 없어요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="project-key" className="mb-1 block text-sm font-medium">
              키
            </label>
            <Input
              id="project-key"
              value={key}
              onChange={(event) => setKey(event.target.value.toUpperCase())}
              placeholder="예: PAY, OPS"
              maxLength={10}
              className="font-mono"
            />
            {key && !keyValid && (
              <p className="mt-1 text-xs text-destructive">
                영문 대문자로 시작하는 2~10자 (대문자·숫자만)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium">
              이름
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 결제 시스템"
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit || createProject.isPending}>
            {createProject.isPending ? "생성 중…" : "프로젝트 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
