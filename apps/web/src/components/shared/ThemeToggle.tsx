"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// 2택 토글이면 한 번 누른 뒤 OS 설정을 다시 따라갈 방법이 없어서 3택으로 둔다.
const THEME_OPTIONS = [
  { value: "system", label: "시스템", Icon: Monitor },
  { value: "light", label: "라이트", Icon: Sun },
  { value: "dark", label: "다크", Icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // 서버는 사용자가 저장해둔 테마를 모른다. 마운트 전에 아이콘·라벨을 고르면 hydration 이
  // 어긋나므로, 첫 렌더에는 기본값 모양을 두고 마운트 후에 실제 선택을 반영한다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selected = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0];
  const Icon = mounted ? selected.Icon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="테마 변경"
          className="w-full justify-start gap-2 px-2.5 text-[13px] font-normal text-foreground/80 hover:bg-muted hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
          {mounted ? selected.label : "테마"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          {THEME_OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2 text-[13px]">
              <OptionIcon className="h-4 w-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
