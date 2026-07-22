"use client";

import { MarkdownBody } from "@/components/issue/MarkdownBody";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/queries/comments";
import { useDeleteComment, useUpdateComment } from "@/lib/queries/comments";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

type CommentItemProps = {
  comment: Comment;
  issueId: string;
  isOwn: boolean;
};

export function CommentItem({ comment, issueId, isOwn }: CommentItemProps) {
  const updateComment = useUpdateComment(issueId);
  const deleteComment = useDeleteComment(issueId);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(comment.body_markdown);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await updateComment.mutateAsync({ commentId: comment.id, body: trimmed });
      setEditing(false);
    } catch (error) {
      toast.error("코멘트 수정에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteComment.mutateAsync(comment.id);
    } catch (error) {
      toast.error("코멘트 삭제에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const relativeTime = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author?.avatar_url ?? undefined} />
        <AvatarFallback>{comment.author?.name.slice(0, 1) ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium">{comment.author?.name ?? "알 수 없음"}</span>
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
          {comment.edited_at && <span className="text-xs text-muted-foreground">(수정됨)</span>}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(comment.body_markdown);
                  setEditing(false);
                }}
              >
                취소
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateComment.isPending}>
                저장
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1 rounded-lg border bg-card p-3">
            <MarkdownBody content={comment.body_markdown} />
            {isOwn && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                {confirmingDelete ? (
                  <>
                    <span className="text-muted-foreground">삭제할까요?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteComment.isPending}
                      className="text-destructive hover:underline"
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
