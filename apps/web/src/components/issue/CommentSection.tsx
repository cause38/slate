"use client";

import { CommentItem } from "@/components/issue/CommentItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments, useCreateComment } from "@/lib/queries/comments";
import { useCurrentUserId } from "@/lib/queries/users";
import { useState } from "react";
import { toast } from "sonner";

type CommentSectionProps = {
  issueId: string;
};

export function CommentSection({ issueId }: CommentSectionProps) {
  const { data: comments } = useComments(issueId);
  const { data: currentUserId } = useCurrentUserId();
  const createComment = useCreateComment(issueId);
  const [body, setBody] = useState("");

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || !currentUserId) return;
    try {
      await createComment.mutateAsync({ body: trimmed, authorId: currentUserId });
      setBody("");
    } catch (error) {
      toast.error("코멘트 등록에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments?.length ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              issueId={issueId}
              isOwn={comment.author_id === currentUserId}
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            아직 코멘트가 없어요. 첫 코멘트를 남겨보세요.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="코멘트 작성… Markdown 지원, @로 멘션"
          className="resize-none border-none shadow-none focus-visible:ring-0"
          disabled={createComment.isPending || !currentUserId}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">**굵게** *기울임* `코드` · @멘션</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!body.trim() || createComment.isPending}
          >
            {createComment.isPending ? "등록 중…" : "코멘트 등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}
