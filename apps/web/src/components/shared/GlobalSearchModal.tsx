"use client";

import { StatusPill } from "@/components/issue/StatusPill";
import { TypePill } from "@/components/issue/TypePill";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCommandKShortcut } from "@/hooks/useCommandKShortcut";
import { useDebounce } from "@/hooks/useDebounce";
import { useIssueSearch } from "@/lib/queries/issue-search";
import { useUiStore } from "@/lib/stores/ui";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/** 검색어 입력이 안정될 때까지 대기 (ms) */
const SEARCH_DEBOUNCE_MS = 200;

export function GlobalSearchModal() {
  const router = useRouter();
  const open = useUiStore((state) => state.searchOpen);
  const setSearchOpen = useUiStore((state) => state.setSearchOpen);
  const toggleSearch = useUiStore((state) => state.toggleSearch);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const { data: results, isFetching } = useIssueSearch(debouncedQuery);

  useCommandKShortcut(toggleSearch);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setSearchOpen(next);
      if (!next) setQuery("");
    },
    [setSearchOpen],
  );

  function handleSelect(issueKey: string) {
    handleOpenChange(false);
    router.push(`/i/${issueKey}`);
  }

  const trimmed = debouncedQuery.trim();

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="이슈 검색"
      description="키·제목·본문으로 이슈를 검색합니다"
    >
      {/* 서버 결과를 그대로 노출 — cmdk 자체 필터 비활성화 */}
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="이슈 검색… 키·제목·본문"
        />
        <CommandList>
          {trimmed.length === 0 ? (
            <CommandEmpty>검색어를 입력하세요.</CommandEmpty>
          ) : isFetching && !results?.length ? (
            <CommandEmpty>검색 중…</CommandEmpty>
          ) : !results?.length ? (
            <CommandEmpty>일치하는 이슈가 없어요.</CommandEmpty>
          ) : (
            <CommandGroup heading="이슈">
              {results.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={issue.id}
                  onSelect={() => handleSelect(issue.key)}
                >
                  {issue.project && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: issue.project.color }}
                      title={issue.project.key}
                    />
                  )}
                  <TypePill type={issue.type} />
                  <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                  <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                  <StatusPill status={issue.status} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
