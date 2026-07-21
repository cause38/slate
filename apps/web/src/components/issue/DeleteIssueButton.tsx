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
import { useDeleteIssue } from "@/lib/queries/issue-detail";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type DeleteIssueButtonProps = {
  issueId: string;
  issueKey: string;
};

export function DeleteIssueButton({ issueId, issueKey }: DeleteIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteIssue = useDeleteIssue();

  async function handleDelete() {
    try {
      await deleteIssue.mutateAsync(issueId);
      toast.success(`${issueKey} 삭제됨`);
      router.push("/");
    } catch (error) {
      toast.error("이슈 삭제에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{issueKey} 삭제</DialogTitle>
          <DialogDescription>
            이 이슈를 삭제하면 되돌릴 수 없어요. 코멘트·활동 로그도 함께 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteIssue.isPending}>
            {deleteIssue.isPending ? "삭제 중…" : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
