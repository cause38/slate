"use client";

import { MarkdownBody } from "@/components/issue/MarkdownBody";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateIssue } from "@/lib/queries/issue-detail";
import { useState } from "react";

type EditableBodyProps = {
  issueKey: string;
  body: string;
};

// 백로그 인라인 생성은 제목만 받는다. 편집이 없으면 그렇게 만든 이슈는 설명을 영영 못 채운다.
export function EditableBody({ issueKey, body }: EditableBodyProps) {
  const update = useUpdateIssue(issueKey);
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const next = draft;
    setDraft(null);
    if (next === body) return;
    update.mutate({ body_markdown: next });
  }

  return (
    <section className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">설명</div>
        {draft === null && (
          <Button variant="ghost" size="sm" onClick={() => setDraft(body)}>
            편집
          </Button>
        )}
      </div>

      {draft === null ? (
        <MarkdownBody content={body} />
      ) : (
        <div className="space-y-2">
          <Textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setDraft(null);
            }}
            rows={10}
            aria-label="이슈 설명"
            placeholder="Markdown 지원"
            className="text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              **굵게** *기울임* `코드` · Esc 로 취소
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                취소
              </Button>
              <Button size="sm" onClick={commit}>
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
