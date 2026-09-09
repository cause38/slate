"use client";

import { Badge } from "@/components/ui/badge";
import { GITHUB_PR_STATE_LABELS, type GithubPrState, isGithubPrState } from "@/lib/constants";
import { useGithubLinks } from "@/lib/queries/github-links";
import { cn } from "@/lib/utils";
import { GitCommitHorizontal, GitPullRequest } from "lucide-react";

type GithubLinksSectionProps = {
  issueId: string;
};

// GitHub PR 상태별 색 (GitHub 관례 색 — 커밋은 상태 없음). merged/closed용 시맨틱 토큰이 없어
// TypePill과 동일하게 팔레트를 쓰고, 통일성을 위해 open도 팔레트로 맞춘다.
const PR_STATE_CLASSES: Record<GithubPrState, string> = {
  open: "bg-emerald-500/15 text-emerald-500",
  merged: "bg-purple-500/15 text-purple-500",
  closed: "bg-red-500/15 text-red-500",
};

const SHORT_SHA_LENGTH = 7;

export function GithubLinksSection({ issueId }: GithubLinksSectionProps) {
  const { data: links, isPending } = useGithubLinks(issueId);

  // 연결이 0건일 때 섹션을 통째로 숨기면 "기능이 없는 것"과 구분되지 않는다.
  // 웹훅이 붙으면 여기가 자동으로 채워진다는 사실을 드러낸다.
  if (isPending) return null;

  if (!links?.length) {
    return (
      <section className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-1 text-sm font-medium">GitHub</div>
        <p className="text-xs text-muted-foreground">
          연결된 PR·커밋이 없어요. 커밋 메시지나 PR 제목에 이슈 키를 넣으면 여기에 자동으로 모여요.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 text-sm font-medium">GitHub ({links.length})</div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              {link.kind === "pr" ? (
                <GitPullRequest className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <GitCommitHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{link.title ?? link.url}</span>
              {link.author && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {link.author}
                </span>
              )}
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {link.kind === "pr"
                  ? `#${link.external_id}`
                  : link.external_id.slice(0, SHORT_SHA_LENGTH)}
              </span>
              {link.kind === "pr" && link.state && isGithubPrState(link.state) && (
                <Badge className={cn("shrink-0", PR_STATE_CLASSES[link.state])}>
                  {GITHUB_PR_STATE_LABELS[link.state]}
                </Badge>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
