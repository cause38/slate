"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Author = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

export type Comment = Tables<"comments"> & {
  author: Author | null;
};

export const commentKeys = {
  all: ["comments"] as const,
  byIssue: (issueId: string) => [...commentKeys.all, issueId] as const,
};

export function useComments(issueId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.byIssue(issueId ?? ""),
    enabled: Boolean(issueId),
    queryFn: async (): Promise<Comment[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select("*, author:users!author_id(id, name, avatar_url)")
        .eq("issue_id", issueId ?? "")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Comment[];
    },
  });
}

function useCommentInvalidation(issueId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: commentKeys.byIssue(issueId) });
  };
}

export function useCreateComment(issueId: string) {
  const invalidate = useCommentInvalidation(issueId);
  return useMutation({
    mutationFn: async (input: { body: string; authorId: string }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("comments").insert({
        issue_id: issueId,
        author_id: input.authorId,
        body_markdown: input.body,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateComment(issueId: string) {
  const invalidate = useCommentInvalidation(issueId);
  return useMutation({
    mutationFn: async (input: { commentId: string; body: string }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .update({ body_markdown: input.body, edited_at: new Date().toISOString() })
        .eq("id", input.commentId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteComment(issueId: string) {
  const invalidate = useCommentInvalidation(issueId);
  return useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
