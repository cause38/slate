"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  isIssuePriority,
  isIssueStatus,
  isIssueType,
} from "@/lib/constants";
import { type ActivityEntry, useActivityLogs } from "@/lib/queries/activity";
import { useProjectIssues } from "@/lib/queries/board-issues";
import { useSprints } from "@/lib/queries/sprints";
import { useManagedUsers } from "@/lib/queries/users";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type ActivityLogProps = {
  issueId: string;
  projectId: string | undefined;
};

const FIELD_LABELS: Record<string, string> = {
  status: "상태",
  priority: "우선순위",
  assignee_id: "담당자",
  sprint_id: "스프린트",
  epic_id: "에픽",
};

export function ActivityLog({ issueId, projectId }: ActivityLogProps) {
  const { data: entries } = useActivityLogs(issueId);
  // UUID → 이름 해석용 매핑 소스 (담당자는 비활성 포함 전체 — 과거 이력 보존)
  const usersQuery = useManagedUsers();
  const sprintsQuery = useSprints(projectId);
  const issuesQuery = useProjectIssues(projectId);
  const users = usersQuery.data;
  const sprints = sprintsQuery.data;
  const issues = issuesQuery.data;
  // 매핑 로딩 중엔 "(삭제된 …)" 오표시가 깜빡이므로 로딩으로 가림
  // (isLoading은 disabled 쿼리에서 false라 projectId 없는 경우에도 안전)
  const mappingsLoading = usersQuery.isLoading || sprintsQuery.isLoading || issuesQuery.isLoading;

  /** jsonb 값(문자열/UUID/null)을 사람이 읽는 라벨로 해석 — null 의미는 필드별로 다름 */
  function resolveValue(field: string | null, value: unknown): string {
    const raw = value === null || value === undefined ? null : String(value);
    switch (field) {
      case "status":
        return raw && isIssueStatus(raw) ? ISSUE_STATUS_LABELS[raw] : (raw ?? "없음");
      case "priority":
        return raw && isIssuePriority(raw) ? ISSUE_PRIORITY_LABELS[raw] : (raw ?? "없음");
      case "assignee_id":
        if (!raw) return "없음";
        return users?.find((u) => u.id === raw)?.name ?? "(삭제된 사용자)";
      case "sprint_id":
        // sprint_id의 null은 백로그를 의미. 미발견 UUID는 삭제된 스프린트
        if (!raw) return "백로그";
        return sprints?.find((s) => s.id === raw)?.name ?? "(삭제된 스프린트)";
      case "epic_id":
        if (!raw) return "없음";
        return issues?.find((i) => i.id === raw)?.title ?? "(삭제된 에픽)";
      default:
        return raw ?? "없음";
    }
  }

  function describe(entry: ActivityEntry): string {
    if (entry.action === "created") {
      const created = entry.new_value as { title?: string; type?: string } | null;
      const typeLabel =
        created?.type && isIssueType(created.type) ? ISSUE_TYPE_LABELS[created.type] : "이슈";
      return `${typeLabel} 생성`;
    }
    const fieldLabel = entry.field ? (FIELD_LABELS[entry.field] ?? entry.field) : entry.action;
    return `${fieldLabel} 변경: ${resolveValue(entry.field, entry.old_value)} → ${resolveValue(entry.field, entry.new_value)}`;
  }

  if (mappingsLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (!entries?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">아직 활동 내역이 없어요.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-3 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={entry.actor?.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {entry.actor?.name.slice(0, 1) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{entry.actor?.name ?? "시스템"}</span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{describe(entry)}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ko })}
          </span>
        </div>
      ))}
    </div>
  );
}
