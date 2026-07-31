"use client";

import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useQuery } from "@tanstack/react-query";

export type GithubLink = Tables<"github_links">;

// issueKeys 하위에 두어 이슈 뮤테이션의 issueKeys.all 무효화가 링크 목록까지
// prefix 매칭으로 갱신되게 한다 (활동/첨부와 동일 패턴).
export const githubLinkKeys = {
  byIssue: (issueId: string) => [...issueKeys.all, "github-links", issueId] as const,
};

export function useGithubLinks(issueId: string | undefined) {
  return useQuery({
    queryKey: githubLinkKeys.byIssue(issueId ?? ""),
    enabled: Boolean(issueId),
    queryFn: async (): Promise<GithubLink[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("github_links")
        .select("*")
        .eq("issue_id", issueId ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
