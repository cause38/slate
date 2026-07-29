"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export type FilterOption = {
  value: string;
  label: string;
  /** 라벨 색 점 */
  color?: string;
  /** 담당자 아바타 */
  avatarUrl?: string | null;
};

type FilterDropdownProps = {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

export function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1", count > 0 && "border-primary/50")}
        >
          {label}
          {count > 0 && (
            <span className="rounded bg-primary/15 px-1 text-xs text-primary">{count}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={`${label} 검색…`} className="h-8" />
          <CommandList>
            <CommandEmpty className="py-3">선택지가 없어요</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => onToggle(option.value)}
                    // 선택 상태를 접근성 이름에 담아 스크린리더에 노출 (체크는 시각 전용)
                    aria-label={isSelected ? `${option.label}, 선택됨` : option.label}
                  >
                    <div
                      aria-hidden
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {option.avatarUrl !== undefined && (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={option.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {option.label.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {option.color && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {count > 0 && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start text-xs text-muted-foreground"
                onClick={onClear}
              >
                {label} 초기화
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
