"use client";

import { ActivityLog } from "@/components/issue/ActivityLog";
import { AttachmentSection } from "@/components/issue/AttachmentSection";
import { CommentSection } from "@/components/issue/CommentSection";
import { DeleteIssueButton } from "@/components/issue/DeleteIssueButton";
import { GithubLinksSection } from "@/components/issue/GithubLinksSection";
import { IssueMetaPanel } from "@/components/issue/IssueMetaPanel";
import { MarkdownBody } from "@/components/issue/MarkdownBody";
import { StatusPill } from "@/components/issue/StatusPill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComments } from "@/lib/queries/comments";
import { useIssueDetail } from "@/lib/queries/issue-detail";

type IssueDetailViewProps = {
  issueKey: string;
};

export function IssueDetailView({ issueKey }: IssueDetailViewProps) {
  const { data: issue, isPending, isError } = useIssueDetail(issueKey);
  // issue 로드 전엔 undefined → useComments가 disabled (조건부 호출 아님)
  const { data: comments } = useComments(issue?.id);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        이슈를 찾을 수 없어요
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 bg-background">
      <div className="min-w-0 flex-1 overflow-auto p-6">
        <div className="mb-2 text-xs text-muted-foreground">
          {issue.project?.key}
          {issue.epic ? ` / ${issue.epic.title}` : ""}
        </div>
        <div className="mb-3 flex items-center gap-2">
          <StatusPill status={issue.status} />
          <span className="font-mono text-sm text-muted-foreground">{issue.key}</span>
          <div className="ml-auto">
            <DeleteIssueButton issueId={issue.id} issueKey={issue.key} />
          </div>
        </div>
        <h1 className="mb-6 text-2xl font-semibold">{issue.title}</h1>

        <section className="mb-6 rounded-lg border bg-card p-4">
          <div className="mb-2 text-sm font-medium">설명</div>
          <MarkdownBody content={issue.body_markdown} />
        </section>

        <GithubLinksSection issueId={issue.id} />

        <AttachmentSection issueId={issue.id} />

        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">코멘트 ({comments?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="activity">활동</TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="mt-4">
            <CommentSection issueId={issue.id} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityLog issueId={issue.id} projectId={issue.project?.id} />
          </TabsContent>
        </Tabs>
      </div>

      <IssueMetaPanel issue={issue} />
    </div>
  );
}
