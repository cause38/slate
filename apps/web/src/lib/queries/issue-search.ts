"use client";

import type { IssueStatus, IssueType } from "@/lib/constants";
import { issueKeys } from "@/lib/queries/issues";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type IssueSearchResult = {
  id: string;
  key: string;
  title: string;
  type: IssueType;
  status: IssueStatus;
  project: Pick<Tables<"projects">, "key" | "color"> | null;
};

const SEARCH_LIMIT = 20;
const SEARCH_SELECT = "id, key, title, type, status, project:projects(key, color)";

export const searchKeys = {
  issues: (query: string) => [...issueKeys.all, "search", query] as const,
};

/**
 * 사용자 입력을 안전한 ilike 패턴(`"%...%"`)으로 변환. 두 겹 이스케이프:
 *  ① LIKE 의미: `%`·`_`·`\`를 백슬래시로 이스케이프해 와일드카드가 아닌 리터럴로 매칭
 *     (예: "50%" 검색 시 %가 임의 문자열로 해석되지 않게).
 *  ② PostgREST or() 문법: 값을 큰따옴표로 감싸 콤마·괄호가 필터를 깨지 않게 하고,
 *     따옴표 안에서 `\`·`"`를 다시 백슬래시로 이스케이프.
 */
function toIlikePattern(raw: string): string {
  const likeEscaped = raw.replace(/[\\%_]/g, (char) => `\\${char}`);
  const orEscaped = likeEscaped.replace(/[\\"]/g, (char) => `\\${char}`);
  return `"%${orEscaped}%"`;
}

/** 전 프로젝트 이슈를 key·제목·본문 부분일치로 검색 (ilike, 최근 수정 순 상위 N건) */
export function useIssueSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: searchKeys.issues(trimmed),
    enabled: trimmed.length > 0,
    // 타이핑마다 queryKey가 바뀌어도 이전 결과를 유지 → "검색 중…" 깜빡임 방지
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<IssueSearchResult[]> => {
      const supabase = createClient();
      const pattern = toIlikePattern(trimmed);
      const { data, error } = await supabase
        .from("issues")
        .select(SEARCH_SELECT)
        .or(`key.ilike.${pattern},title.ilike.${pattern},body_markdown.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(SEARCH_LIMIT);
      if (error) throw error;
      return data as unknown as IssueSearchResult[];
    },
  });
}
