"use client";

import { Input } from "@/components/ui/input";
import { useCreateIssue } from "@/lib/queries/issues";
import { useCurrentUserId } from "@/lib/queries/users";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InlineCreateIssueProps = {
  projectId: string;
};

/** 백로그 상단 인라인 생성 — 제목만 입력하고 Enter로 빠르게 (화면 4) */
export function InlineCreateIssue({ projectId }: InlineCreateIssueProps) {
  const createIssue = useCreateIssue();
  const { data: currentUserId } = useCurrentUserId();
  const [title, setTitle] = useState("");

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed || !currentUserId) return;
    try {
      await createIssue.mutateAsync({
        project_id: projectId,
        title: trimmed,
        reporter_id: currentUserId,
      });
      setTitle("");
    } catch (error) {
      toast.error("이슈 생성에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-2">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleCreate();
          }
        }}
        placeholder="새 이슈 제목을 입력하고 Enter…"
        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0"
        disabled={createIssue.isPending || !currentUserId}
      />
    </div>
  );
}
