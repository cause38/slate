import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";

// 이슈 키: 프로젝트 키(2~10자) + '-' + 번호. 예: DOTOLI-42.
// 소문자 브랜치명(feat/dotoli-42)도 잡으려 대소문자 무시로 매칭하고 대문자로 정규화한다.
// 버전 토큰(UTF-8, SHA-256 등) 과대매칭은 findIssueIdByKey의 DB 조회에서 없는 키로 걸러진다.
const ISSUE_KEY_RE = /\b[A-Z][A-Z0-9]{1,9}-\d+\b/gi;

function extractIssueKeys(text: string): string[] {
  return [...new Set((text.match(ISSUE_KEY_RE) ?? []).map((key) => key.toUpperCase()))];
}

/** HMAC SHA-256 hex 서명 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 길이 유출 없는 상수 시간 비교 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** GitHub x-hub-signature-256 (형식: "sha256=<hex>") 검증 */
async function verifySignature(
  body: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const expected = `sha256=${await hmacSha256Hex(secret, body)}`;
  return timingSafeEqual(expected, signatureHeader);
}

async function findIssueIdByKey(supabase: SupabaseClient, key: string): Promise<string | null> {
  const { data, error } = await supabase.from("issues").select("id").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function handlePullRequest(
  supabase: SupabaseClient,
  payload: {
    action: string;
    pull_request: {
      number: number;
      title: string;
      body: string | null;
      html_url: string;
      state: string;
      merged: boolean;
      head: { ref: string };
      user: { login: string };
    };
  },
): Promise<number> {
  const pr = payload.pull_request;
  const keys = extractIssueKeys(`${pr.title} ${pr.body ?? ""} ${pr.head.ref}`);
  let linked = 0;

  for (const key of keys) {
    const issueId = await findIssueIdByKey(supabase, key);
    if (!issueId) continue;
    linked++;

    const { error: linkError } = await supabase.from("github_links").upsert(
      {
        issue_id: issueId,
        kind: "pr",
        external_id: String(pr.number),
        url: pr.html_url,
        title: pr.title,
        state: pr.merged ? "merged" : pr.state,
        author: pr.user.login,
      },
      { onConflict: "issue_id,kind,external_id" },
    );
    if (linkError) throw linkError;

    // 자동 상태 전환 (프로젝트 자동화 설정은 RPC 내부에서 존중).
    // merged는 영속 상태라 병합 '액션'(closed+merged)으로 게이팅해야
    // 병합된 PR의 후속 이벤트(edited/labeled)마다 재전환되는 것을 막는다.
    if (payload.action === "opened") {
      const { error } = await supabase.rpc("transition_if_todo", {
        p_issue_id: issueId,
        p_to: "in_review",
      });
      if (error) throw error;
    } else if (payload.action === "closed" && pr.merged) {
      const { error } = await supabase.rpc("transition_if_open", {
        p_issue_id: issueId,
        p_to: "done",
      });
      if (error) throw error;
    }
  }
  return linked;
}

async function handlePush(
  supabase: SupabaseClient,
  payload: {
    commits: {
      id: string;
      message: string;
      url: string;
      author: { username?: string; name: string };
    }[];
  },
): Promise<number> {
  let linked = 0;
  for (const commit of payload.commits ?? []) {
    const keys = extractIssueKeys(commit.message);
    for (const key of keys) {
      const issueId = await findIssueIdByKey(supabase, key);
      if (!issueId) continue;
      linked++;
      const { error: linkError } = await supabase.from("github_links").upsert(
        {
          issue_id: issueId,
          kind: "commit",
          external_id: commit.id,
          url: commit.url,
          title: commit.message.split("\n")[0],
          author: commit.author.username ?? commit.author.name,
        },
        { onConflict: "issue_id,kind,external_id" },
      );
      if (linkError) throw linkError;
    }
  }
  return linked;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("GITHUB_WEBHOOK_SECRET");
  if (!secret) {
    return new Response("server misconfigured", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!(await verifySignature(body, signature, secret))) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  const event = req.headers.get("x-github-event");
  const supabase = createServiceClient();
  let linked = 0;

  // DB 작업 실패는 500으로 돌려 GitHub 재전송을 유도한다(upsert 멱등이라 중복 안전).
  // 삼켜서 200을 주면 링크/전환이 조용히 유실된다.
  try {
    if (event === "pull_request") {
      linked = await handlePullRequest(
        supabase,
        payload as Parameters<typeof handlePullRequest>[1],
      );
    } else if (event === "push") {
      linked = await handlePush(supabase, payload as Parameters<typeof handlePush>[1]);
    }
  } catch (error) {
    console.error("github-webhook 처리 실패:", error);
    return new Response("processing error", { status: 500 });
  }

  return Response.json({ ok: true, event, linked });
});
