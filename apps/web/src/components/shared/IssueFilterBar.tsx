"use client";

import { FilterDropdown, type FilterOption } from "@/components/shared/FilterDropdown";
import { Button } from "@/components/ui/button";
import {
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPES,
  ISSUE_TYPE_LABELS,
} from "@/lib/constants";
import {
  type FilterDimension,
  type FilterOptions,
  type IssueFilters,
  NO_EPIC,
  UNASSIGNED,
  activeFilterCount,
} from "@/lib/issue-filters";

type IssueFilterBarProps = {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  options: FilterOptions;
  /** 표시할 필터 차원 (페이지별로 다름 — 보드는 status 제외 등) */
  dimensions: FilterDimension[];
};

const TYPE_OPTIONS: FilterOption[] = ISSUE_TYPES.map((type) => ({
  value: type,
  label: ISSUE_TYPE_LABELS[type],
}));

const STATUS_OPTIONS: FilterOption[] = ISSUE_STATUSES.map((status) => ({
  value: status,
  label: ISSUE_STATUS_LABELS[status],
}));

export function IssueFilterBar({ filters, onChange, options, dimensions }: IssueFilterBarProps) {
  function toggle(dimension: FilterDimension, value: string) {
    // 차원별 배열 타입(IssueType[] 등)을 string[]로 통일해 다루고, 결과만 캐스팅.
    // value는 항상 해당 차원의 옵션에서만 오므로(enum 값 포함) 안전.
    const current = filters[dimension] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [dimension]: next } as IssueFilters);
  }

  function clear(dimension: FilterDimension) {
    onChange({ ...filters, [dimension]: [] });
  }

  const assigneeOptions: FilterOption[] = [
    ...(options.hasUnassigned ? [{ value: UNASSIGNED, label: "미지정" }] : []),
    ...options.assignees.map((a) => ({ value: a.id, label: a.name, avatarUrl: a.avatarUrl })),
  ];
  const labelOptions: FilterOption[] = options.labels.map((l) => ({
    value: l.id,
    label: l.name,
    color: l.color,
  }));
  const epicOptions: FilterOption[] = [
    ...options.epics.map((e) => ({ value: e.id, label: e.title })),
    ...(options.hasNoEpic ? [{ value: NO_EPIC, label: "에픽 없음" }] : []),
  ];

  const dropdowns: Record<FilterDimension, React.ReactNode> = {
    types: (
      <FilterDropdown
        label="타입"
        options={TYPE_OPTIONS}
        selected={filters.types}
        onToggle={(v) => toggle("types", v)}
        onClear={() => clear("types")}
      />
    ),
    statuses: (
      <FilterDropdown
        label="상태"
        options={STATUS_OPTIONS}
        selected={filters.statuses}
        onToggle={(v) => toggle("statuses", v)}
        onClear={() => clear("statuses")}
      />
    ),
    assigneeIds: (
      <FilterDropdown
        label="담당자"
        options={assigneeOptions}
        selected={filters.assigneeIds}
        onToggle={(v) => toggle("assigneeIds", v)}
        onClear={() => clear("assigneeIds")}
      />
    ),
    epicIds: (
      <FilterDropdown
        label="에픽"
        options={epicOptions}
        selected={filters.epicIds}
        onToggle={(v) => toggle("epicIds", v)}
        onClear={() => clear("epicIds")}
      />
    ),
    labelIds: (
      <FilterDropdown
        label="라벨"
        options={labelOptions}
        selected={filters.labelIds}
        onToggle={(v) => toggle("labelIds", v)}
        onClear={() => clear("labelIds")}
      />
    ),
  };

  const total = activeFilterCount(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-card/50 px-4 py-2">
      {dimensions.map((dimension) => (
        <span key={dimension}>{dropdowns[dimension]}</span>
      ))}
      {total > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => onChange({ ...filters, ...emptyForDimensions(dimensions) })}
        >
          전체 초기화 ({total})
        </Button>
      )}
    </div>
  );
}

/** 표시 중인 차원만 초기화 (숨긴 차원의 값은 건드리지 않음) */
function emptyForDimensions(dimensions: FilterDimension[]): Partial<IssueFilters> {
  const cleared: Partial<IssueFilters> = {};
  for (const dimension of dimensions) {
    cleared[dimension] = [];
  }
  return cleared;
}
