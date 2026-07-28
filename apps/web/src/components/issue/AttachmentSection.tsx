"use client";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format-bytes";
import {
  type Attachment,
  getSignedDownloadUrl,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from "@/lib/queries/attachments";
import { useCurrentUserId } from "@/lib/queries/users";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type AttachmentSectionProps = {
  issueId: string;
};

/** 버킷 file_size_limit과 동일한 클라이언트 사전 검사 값 (25MB) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function AttachmentSection({ issueId }: AttachmentSectionProps) {
  const { data: attachments } = useAttachments(issueId);
  const { data: currentUserId } = useCurrentUserId();
  const uploadAttachment = useUploadAttachment(issueId);
  const deleteAttachment = useDeleteAttachment(issueId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일 재선택도 감지되도록 값 초기화
    event.target.value = "";
    if (!file || !currentUserId) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일이 너무 커요", {
        description: `최대 ${formatBytes(MAX_FILE_SIZE)}까지 올릴 수 있어요.`,
      });
      return;
    }
    try {
      await uploadAttachment.mutateAsync({ file, uploaderId: currentUserId });
    } catch (error) {
      toast.error("업로드에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleDownload(attachment: Attachment) {
    setDownloadingId(attachment.id);
    try {
      const url = await getSignedDownloadUrl(attachment.storage_path);
      // async 갭 뒤 window.open은 팝업 차단에 막히므로 앵커 클릭으로 다운로드 트리거
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.filename;
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } catch (error) {
      toast.error("다운로드 URL 발급에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(attachment: Attachment) {
    try {
      await deleteAttachment.mutateAsync({
        id: attachment.id,
        storage_path: attachment.storage_path,
      });
    } catch (error) {
      toast.error("삭제에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <section className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          첨부파일 ({attachments?.length ?? 0})
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending || !currentUserId}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          {uploadAttachment.isPending ? "업로드 중…" : "파일 추가"}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {attachments?.length ? (
        <ul className="divide-y">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 py-2 text-sm">
              <button
                type="button"
                onClick={() => handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
                className="flex min-w-0 flex-1 items-center gap-2 text-left hover:underline"
              >
                <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{attachment.filename}</span>
              </button>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(attachment.size)}
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {attachment.uploader?.name ?? "알 수 없음"}
              </span>
              {attachment.uploader_id === currentUserId && (
                <button
                  type="button"
                  aria-label={`${attachment.filename} 삭제`}
                  onClick={() => handleDelete(attachment)}
                  disabled={deleteAttachment.isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-sm text-muted-foreground">아직 첨부파일이 없어요.</p>
      )}
    </section>
  );
}
