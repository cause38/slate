"use client";

import { LabelBadge } from "@/components/issue/LabelBadge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { IssueLabel } from "@/lib/queries/issue-detail";
import { LABEL_COLOR_PRESETS, useCreateLabel, useLabels } from "@/lib/queries/labels";
import { useToggleIssueLabel } from "@/lib/queries/labels";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LabelPickerProps = {
  issueId: string;
  issueKey: string;
  projectId: string;
  attached: IssueLabel[];
};

export function LabelPicker({ issueId, issueKey, projectId, attached }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: labels } = useLabels(projectId);
  const toggle = useToggleIssueLabel(issueKey);
  const createLabel = useCreateLabel(projectId);

  const attachedIds = new Set(attached.map((label) => label.id));
  const trimmed = query.trim();
  const exactExists = (labels ?? []).some(
    (label) => label.name.toLowerCase() === trimmed.toLowerCase(),
  );

  function handleToggle(labelId: string, isAttached: boolean) {
    toggle.mutate(
      { issueId, labelId, attached: isAttached },
      {
        onError: (error) =>
          toast.error("라벨 변경에 실패했어요", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  }

  async function handleCreateAndAttach() {
    if (!trimmed) return;
    try {
      // 신규 라벨 색은 부착 개수 기준으로 프리셋 순환
      const color = LABEL_COLOR_PRESETS[(labels?.length ?? 0) % LABEL_COLOR_PRESETS.length];
      const created = await createLabel.mutateAsync({ name: trimmed, color });
      await toggle.mutateAsync({ issueId, labelId: created.id, attached: false });
      setQuery("");
    } catch (error) {
      toast.error("라벨 생성에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {attached.map((label) => (
        <LabelBadge key={label.id} name={label.name} color={label.color} />
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 rounded px-1.5 text-muted-foreground"
            aria-label="라벨 추가"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-0">
          <Command>
            <CommandInput placeholder="라벨 검색·생성…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty className="py-2">
                {trimmed ? "결과 없음" : "라벨을 입력하세요"}
              </CommandEmpty>
              <CommandGroup>
                {(labels ?? []).map((label) => {
                  const isAttached = attachedIds.has(label.id);
                  return (
                    <CommandItem
                      key={label.id}
                      value={label.name}
                      onSelect={() => handleToggle(label.id, isAttached)}
                    >
                      <LabelBadge name={label.name} color={label.color} />
                      {isAttached && <Check className="ml-auto h-3.5 w-3.5" />}
                    </CommandItem>
                  );
                })}
                {trimmed && !exactExists && (
                  <CommandItem value={`__create_${trimmed}`} onSelect={handleCreateAndAttach}>
                    <Plus className="h-3.5 w-3.5" />"{trimmed}" 생성
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
