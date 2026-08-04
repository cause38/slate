"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useUiStore } from "@/lib/stores/ui";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["C"], label: "빠른 이슈 생성" },
  { keys: ["⌘", "K"], label: "이슈 검색" },
  { keys: ["?"], label: "단축키 도움말" },
];

export function ShortcutsHelpDialog() {
  const open = useUiStore((state) => state.helpOpen);
  const setHelpOpen = useUiStore((state) => state.setHelpOpen);
  const toggleHelp = useUiStore((state) => state.toggleHelp);

  // ?(Shift+/)로 토글 — useGlobalShortcut이 입력 필드 안에서는 무시
  useGlobalShortcut("?", toggleHelp);

  return (
    <Dialog open={open} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>단축키</DialogTitle>
          <DialogDescription>입력창 밖에서 사용할 수 있어요.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label} className="flex items-center justify-between text-sm">
              <span>{shortcut.label}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
