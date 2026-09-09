"use client";

import { Input } from "@/components/ui/input";
import { useUpdateIssue } from "@/lib/queries/issue-detail";
import { useState } from "react";

type EditableTitleProps = {
  issueKey: string;
  title: string;
};

// 제목을 고칠 방법이 없어서 오타 하나에 이슈를 지우고 다시 만들어야 했다. 그러면 이슈 키가
// 바뀌는데, 키 불변은 CLAUDE.md 절대원칙 1이라 재생성 자체가 규칙 위반이었다.
export function EditableTitle({ issueKey, title }: EditableTitleProps) {
  const update = useUpdateIssue(issueKey);
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    // title 은 NOT NULL 이고, 빈 제목이면 목록에서 이슈를 구분할 수 없게 된다. 되돌린다.
    if (!next || next === title) return;
    update.mutate({ title: next });
  }

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(title)}
        title="클릭해서 제목 수정"
        className="mb-6 block w-full rounded-md px-1 py-0.5 text-left text-2xl font-semibold transition-colors hover:bg-muted"
      >
        {title}
      </button>
    );
  }

  return (
    <Input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") setDraft(null);
      }}
      aria-label="이슈 제목"
      className="mb-6 h-auto px-1 py-0.5 text-2xl font-semibold md:text-2xl"
    />
  );
}
