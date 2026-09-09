import type { IssuePriority, IssueStatus, IssueType } from "@/lib/constants";
import type { Database, Tables } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Person = Pick<Tables<"users">, "id" | "name" | "avatar_url">;

// DB check 제약이 보장하는 값을 도메인 유니온으로 한 번만 좁혀,
// 소비처(Pill 등)에서 `as` 단언이 산개하지 않게 한다.
export type IssueLabel = Pick<Tables<"labels">, "id" | "name" | "color">;

export type IssueDetail = Omit<Tables<"issues">, "status" | "type" | "priority"> & {
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  project: Pick<Tables<"projects">, "id" | "key" | "name" | "color"> | null;
  assignee: Person | null;
  reporter: Person | null;
  epic: Pick<Tables<"issues">, "id" | "key" | "title"> | null;
  labels: IssueLabel[];
};

const DETAIL_SELECT = `
  *,
  project:projects(id, key, name, color),
  assignee:users!assignee_id(id, name, avatar_url),
  reporter:users!reporter_id(id, name, avatar_url),
  epic:issues!epic_id(id, key, title),
  labels:issue_labels(label:labels(id, name, color))
`;

/**
 * 서버 프리페치와 클라이언트 훅이 같은 키를 써야 하이드레이션이 맞물린다.
 * `issueKeys.detail` 이 이 함수를 그대로 쓰므로 두 값이 어긋날 수 없다.
 */
export function issueDetailKey(issueKey: string) {
  return ["issues", "detail", issueKey] as const;
}

/**
 * 상세 조회 본체. 서버 컴포넌트(프리페치)와 클라이언트 훅이 공유한다.
 * 클라이언트에만 두면 서버가 읽은 이슈를 브라우저가 처음부터 다시 읽는 워터폴이 생긴다.
 */
export async function fetchIssueDetail(
  supabase: SupabaseClient<Database>,
  issueKey: string,
): Promise<IssueDetail> {
  const { data, error } = await supabase
    .from("issues")
    .select(DETAIL_SELECT)
    .eq("key", issueKey)
    .single();
  if (error) throw error;

  // self-참조 임베드(epic)는 PostgREST가 배열로 반환 → 단일 관계로 정규화.
  // labels는 issue_labels 조인 테이블 경유라 [{ label: {...} }] 형태 → 평탄화.
  const row = data as unknown as Omit<IssueDetail, "epic" | "labels"> & {
    epic: IssueDetail["epic"] | IssueDetail["epic"][];
    labels: { label: IssueLabel | null }[];
  };
  const epic = Array.isArray(row.epic) ? (row.epic[0] ?? null) : row.epic;
  const labels = row.labels
    .map((entry) => entry.label)
    .filter((label): label is IssueLabel => label !== null);
  return { ...row, epic, labels };
}
