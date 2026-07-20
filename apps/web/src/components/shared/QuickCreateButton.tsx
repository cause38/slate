"use client";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui";

export function QuickCreateButton() {
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);

  return (
    <Button size="sm" onClick={openQuickCreate}>
      ＋ 빠른 생성
      <kbd className="rounded bg-background/20 px-1 font-mono text-[10px]">C</kbd>
    </Button>
  );
}
