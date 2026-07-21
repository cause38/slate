"use client";

import { LabelPicker } from "@/components/issue/LabelPicker";
import { MetaRow } from "@/components/issue/MetaRow";
import { PriorityLabel } from "@/components/issue/PriorityLabel";
import { StatusPill } from "@/components/issue/StatusPill";
import { TypePill } from "@/components/issue/TypePill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPES,
  ISSUE_TYPE_LABELS,
  STORY_POINT_OPTIONS,
  isIssuePriority,
  isIssueStatus,
  isIssueType,
} from "@/lib/constants";
import { formatDateColumn, formatShortDate } from "@/lib/date";
import type { IssueDetail } from "@/lib/queries/issue-detail";
import { useUpdateIssue } from "@/lib/queries/issue-detail";
import { useUsers } from "@/lib/queries/users";
import Link from "next/link";
import { useState } from "react";

const UNASSIGNED = "none";

type IssueMetaPanelProps = {
  issue: IssueDetail;
};

export function IssueMetaPanel({ issue }: IssueMetaPanelProps) {
  const update = useUpdateIssue(issue.key);
  const { data: users } = useUsers();
  const [dueOpen, setDueOpen] = useState(false);

  return (
    <aside className="w-72 shrink-0 space-y-3 overflow-auto border-l bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">상세</div>

      <MetaRow label="타입">
        <Select
          value={issue.type}
          onValueChange={(value) => isIssueType(value) && update.mutate({ type: value })}
        >
          <SelectTrigger size="sm" className="border-none bg-transparent shadow-none">
            <TypePill type={issue.type} />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ISSUE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MetaRow>

      <MetaRow label="상태">
        <Select
          value={issue.status}
          onValueChange={(value) => isIssueStatus(value) && update.mutate({ status: value })}
        >
          <SelectTrigger size="sm" className="border-none bg-transparent shadow-none">
            <StatusPill status={issue.status} />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ISSUE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MetaRow>

      <MetaRow label="담당자">
        <Select
          value={issue.assignee_id ?? UNASSIGNED}
          onValueChange={(value) =>
            update.mutate({ assignee_id: value === UNASSIGNED ? null : value })
          }
        >
          <SelectTrigger size="sm" className="border-none bg-transparent shadow-none">
            {issue.assignee ? (
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={issue.assignee.avatar_url ?? undefined} />
                  <AvatarFallback>{issue.assignee.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                {issue.assignee.name}
              </span>
            ) : (
              <span className="text-muted-foreground">없음</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>없음</SelectItem>
            {(users ?? []).map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MetaRow>

      <MetaRow label="보고자">
        <span className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={issue.reporter?.avatar_url ?? undefined} />
            <AvatarFallback>{issue.reporter?.name.slice(0, 1) ?? "?"}</AvatarFallback>
          </Avatar>
          {issue.reporter?.name ?? "—"}
        </span>
      </MetaRow>

      <MetaRow label="우선순위">
        <Select
          value={issue.priority}
          onValueChange={(value) => isIssuePriority(value) && update.mutate({ priority: value })}
        >
          <SelectTrigger size="sm" className="border-none bg-transparent shadow-none">
            <PriorityLabel priority={issue.priority} />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <PriorityLabel priority={priority} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MetaRow>

      <MetaRow label="스토리 포인트">
        <Select
          value={issue.story_points === null ? UNASSIGNED : String(issue.story_points)}
          onValueChange={(value) =>
            update.mutate({ story_points: value === UNASSIGNED ? null : Number(value) })
          }
        >
          <SelectTrigger size="sm" className="border-none bg-transparent shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>—</SelectItem>
            {STORY_POINT_OPTIONS.map((point) => (
              <SelectItem key={point} value={String(point)}>
                {point}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MetaRow>

      <MetaRow label="마감일">
        <Popover open={dueOpen} onOpenChange={setDueOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 font-normal">
              {issue.due_date ? formatShortDate(issue.due_date) : "—"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={issue.due_date ? new Date(issue.due_date) : undefined}
              onSelect={(date) => {
                update.mutate({
                  due_date: date ? formatDateColumn(date) : null,
                });
                setDueOpen(false);
              }}
            />
            {issue.due_date && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    update.mutate({ due_date: null });
                    setDueOpen(false);
                  }}
                >
                  마감일 지우기
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </MetaRow>

      {issue.epic && (
        <MetaRow label="에픽">
          <Link href={`/i/${issue.epic.key}`} className="truncate hover:underline">
            {issue.epic.title}
          </Link>
        </MetaRow>
      )}

      {issue.project && (
        <div className="space-y-1.5 pt-1">
          <div className="text-muted-foreground">라벨</div>
          <LabelPicker
            issueId={issue.id}
            issueKey={issue.key}
            projectId={issue.project.id}
            attached={issue.labels}
          />
        </div>
      )}
    </aside>
  );
}
