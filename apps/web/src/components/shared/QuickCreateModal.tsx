"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPES,
  ISSUE_TYPE_LABELS,
  STORY_POINT_OPTIONS,
} from "@/lib/constants";
import { useCreateIssue } from "@/lib/queries/issues";
import { useProjects } from "@/lib/queries/projects";
import { useCurrentUserId, useUsers } from "@/lib/queries/users";
import { useUiStore } from "@/lib/stores/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NONE_VALUE = "none";

const quickCreateSchema = z.object({
  projectId: z.string().min(1, "프로젝트를 선택해주세요"),
  title: z.string().trim().min(1, "제목을 입력해주세요").max(500),
  body: z.string(),
  type: z.enum(ISSUE_TYPES),
  priority: z.enum(ISSUE_PRIORITIES),
  assigneeId: z.string(),
  storyPoints: z.string(),
});

type QuickCreateForm = z.infer<typeof quickCreateSchema>;

export function QuickCreateModal() {
  const { quickCreateOpen, setQuickCreateOpen, openQuickCreate } = useUiStore();
  const params = useParams<{ projectKey?: string }>();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { data: currentUserId } = useCurrentUserId();
  const createIssue = useCreateIssue();
  const titleRef = useRef<HTMLInputElement>(null);

  useGlobalShortcut("c", openQuickCreate);

  const currentProject = projects?.find((p) => p.key === params.projectKey);
  const defaultProjectId = currentProject?.id ?? projects?.[0]?.id ?? "";

  const { control, register, handleSubmit, reset, formState } = useForm<QuickCreateForm>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      projectId: defaultProjectId,
      title: "",
      body: "",
      type: "task",
      priority: "medium",
      assigneeId: currentUserId ?? NONE_VALUE,
      storyPoints: NONE_VALUE,
    },
  });

  // 모달이 열리는 순간에만 최신 디폴트로 초기화한다.
  // 열려 있는 동안 재초기화하면 사용자가 바꾼 프로젝트/담당자 선택을 덮어쓴다.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (quickCreateOpen && !wasOpen.current) {
      reset({
        projectId: defaultProjectId,
        title: "",
        body: "",
        type: "task",
        priority: "medium",
        assigneeId: currentUserId ?? NONE_VALUE,
        storyPoints: NONE_VALUE,
      });
    }
    wasOpen.current = quickCreateOpen;
  }, [quickCreateOpen, defaultProjectId, currentUserId, reset]);

  function buildPayload(values: QuickCreateForm) {
    if (!currentUserId) throw new Error("로그인 정보를 확인할 수 없어요");
    return {
      project_id: values.projectId,
      title: values.title,
      body_markdown: values.body,
      type: values.type,
      priority: values.priority,
      assignee_id: values.assigneeId === NONE_VALUE ? null : values.assigneeId,
      story_points: values.storyPoints === NONE_VALUE ? null : Number(values.storyPoints),
      reporter_id: currentUserId,
    };
  }

  async function submit(values: QuickCreateForm, keepOpen: boolean) {
    try {
      const issue = await createIssue.mutateAsync(buildPayload(values));
      toast.success(`${issue.key} 생성됨`, { description: issue.title });
      reset({
        projectId: values.projectId,
        title: "",
        body: "",
        type: values.type,
        priority: values.priority,
        assigneeId: values.assigneeId,
        storyPoints: values.storyPoints,
      });
      if (keepOpen) {
        titleRef.current?.focus();
      } else {
        setQuickCreateOpen(false);
      }
    } catch (error) {
      toast.error("이슈 생성에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const submitAndClose = handleSubmit((values) => submit(values, false));
  const submitAndContinue = handleSubmit((values) => submit(values, true));

  const { ref: titleFieldRef, ...titleField } = register("title");

  return (
    <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
      <DialogContent className="top-24 translate-y-0 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="sr-only">새 이슈 생성</DialogTitle>
          <div className="flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    size="sm"
                    aria-label="프로젝트 선택"
                    className="h-7 w-auto gap-1.5 font-mono text-xs"
                  >
                    <SelectValue placeholder="프로젝트" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span className="text-muted-foreground">/ 새 이슈</span>
          </div>
        </DialogHeader>

        <form
          onSubmit={submitAndClose}
          onKeyDown={(event) => {
            // Enter는 여기서 명시적으로 처리하고 preventDefault로 native form 제출을
            // 차단한다 (native 제출이 새어나가면 페이지가 리로드/네비게이션됨).
            // 버튼 클릭은 onSubmit 경로로 처리됨. Textarea 안에서는 줄바꿈 허용.
            if (event.key !== "Enter") return;
            if (event.target instanceof HTMLTextAreaElement) return;
            event.preventDefault();
            if (createIssue.isPending) return; // 연타 중복 생성 방지 (버튼 disabled와 일치)
            if (event.shiftKey) void submitAndContinue();
            else void submitAndClose();
          }}
        >
          <Input
            {...titleField}
            ref={(el) => {
              titleFieldRef(el);
              titleRef.current = el;
            }}
            autoFocus
            placeholder="제목을 입력하세요…"
            className="border-none px-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {formState.errors.title && (
            <p className="mt-1 text-xs text-destructive">{formState.errors.title.message}</p>
          )}

          <Textarea
            {...register("body")}
            rows={3}
            placeholder="설명 (선택, Markdown 지원)"
            className="mt-2 resize-none"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger size="sm" className="text-xs">
                    타입: <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ISSUE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger size="sm" className="text-xs">
                    담당자: <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>없음</SelectItem>
                    {(users ?? []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.id === currentUserId ? `${user.name} (본인)` : user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger size="sm" className="text-xs">
                    우선순위: <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {ISSUE_PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name="storyPoints"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger size="sm" className="text-xs">
                    포인트: <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>—</SelectItem>
                    {STORY_POINT_OPTIONS.map((point) => (
                      <SelectItem key={point} value={String(point)}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Enter로 생성 후 닫기 · ⇧Enter로 생성 후 이어 만들기
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                Esc로 닫기
              </Badge>
              <Button type="submit" size="sm" disabled={createIssue.isPending}>
                {createIssue.isPending ? "생성 중…" : "이슈 생성"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
