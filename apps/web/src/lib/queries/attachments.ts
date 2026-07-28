"use client";

import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BUCKET = "attachments";
/** 서명 다운로드 URL 유효 시간 (초) */
const SIGNED_URL_TTL = 60;

type Uploader = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

export type Attachment = Tables<"attachments"> & {
  uploader: Uploader | null;
};

// issueKeys 하위에 두어 이슈 뮤테이션의 issueKeys.all 무효화가 첨부 목록까지
// prefix 매칭으로 갱신되게 한다 (activity와 동일 패턴).
export const attachmentKeys = {
  byIssue: (issueId: string) => [...issueKeys.all, "attachments", issueId] as const,
};

export function useAttachments(issueId: string | undefined) {
  return useQuery({
    queryKey: attachmentKeys.byIssue(issueId ?? ""),
    enabled: Boolean(issueId),
    queryFn: async (): Promise<Attachment[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("attachments")
        .select("*, uploader:users!uploader_id(id, name, avatar_url)")
        .eq("issue_id", issueId ?? "")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Attachment[];
    },
  });
}

/** 파일명 충돌 방지를 위한 랜덤 접두사 (브라우저 crypto) */
function randomPrefix(): string {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * storage 키에 안전한 파일명으로 변환 — 슬래시·제어문자·공백 등을 `_`로.
 * 원본 표시명은 attachments.filename 컬럼에 별도 보존한다.
 */
function sanitizeForStoragePath(filename: string): string {
  const cleaned = filename.replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "file";
}

export function useUploadAttachment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; uploaderId: string }): Promise<void> => {
      const supabase = createClient();
      const path = `${issueId}/${randomPrefix()}-${sanitizeForStoragePath(input.file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, { contentType: input.file.type || undefined });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("attachments").insert({
        issue_id: issueId,
        uploader_id: input.uploaderId,
        filename: input.file.name,
        storage_path: path,
        size: input.file.size,
        mime_type: input.file.type || null,
      });
      // 메타 삽입 실패 시 방금 올린 객체를 정리 (고아 파일 방지)
      if (insertError) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]);
        if (cleanupError) {
          console.error("첨부 업로드 롤백 실패 (고아 파일 잔존):", path, cleanupError);
        }
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byIssue(issueId) });
    },
  });
}

export function useDeleteAttachment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: Pick<Attachment, "id" | "storage_path">): Promise<void> => {
      const supabase = createClient();
      // 메타를 먼저 지운다 — storage remove가 실패하면 최악이 "고아 파일"(용량만 낭비)로
      // 완화되고 UI 정합은 유지된다. 반대 순서면 "파일 없는 레코드"로 다운로드가 404.
      const { error: deleteError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);
      if (deleteError) throw deleteError;
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove([attachment.storage_path]);
      if (removeError) {
        console.error(
          "첨부 메타 삭제 후 storage 정리 실패 (고아 파일 잔존):",
          attachment,
          removeError,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byIssue(issueId) });
    },
  });
}

/** 클릭 시점에 짧은 만료의 서명 다운로드 URL 발급 (비공개 버킷) */
export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL, { download: true });
  if (error) throw error;
  return data.signedUrl;
}
