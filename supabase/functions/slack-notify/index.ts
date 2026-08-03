import { type QueueEvent, buildSlackMessage, postToSlackWebhook } from "../_shared/slack.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const QUEUE = "slack_notify_queue";
// 처리 중 다른 소비자에게 비가시(초). 배치 50건 × Slack 왕복 여유를 두고 60초.
const VISIBILITY_TIMEOUT = 60;
const BATCH_SIZE = 50;

type QueueRow = {
  msg_id: number;
  message: QueueEvent;
};

Deno.serve(async () => {
  const supabase = createServiceClient();
  // SLACK_WEBHOOK_URL 미설정 시 드라이런 — 블록을 로깅만 하고 발송은 건너뛴다.
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL") ?? null;

  const { data: messages, error: readError } = await supabase.rpc("pgmq_read", {
    queue_name: QUEUE,
    vt: VISIBILITY_TIMEOUT,
    qty: BATCH_SIZE,
  });
  if (readError) {
    console.error("slack-notify 큐 읽기 실패:", readError);
    return new Response("queue read error", { status: 500 });
  }

  const rows = (messages ?? []) as QueueRow[];
  if (rows.length === 0) {
    return Response.json({ processed: 0, sent: 0, dryRun: 0, skipped: 0, failed: 0 });
  }

  let sent = 0;
  let dryRun = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    // 발송/스킵이 끝나야 true — 이후 큐에서 제거한다
    let handled = false;
    try {
      const event = row.message;
      const { data: issue } = await supabase
        .from("issues")
        .select("key, title, assignee:users!assignee_id(name), project:projects(key, name)")
        .eq("id", event.issue_id)
        .maybeSingle();

      // 이슈가 삭제됐거나 페이로드가 깨져 찾을 수 없으면 보낼 게 없음 — 큐에서 제거
      if (!issue) {
        skipped++;
        handled = true;
      } else {
        let actorName: string | null = null;
        if (event.actor) {
          const { data: actor } = await supabase
            .from("users")
            .select("name")
            .eq("id", event.actor)
            .maybeSingle();
          actorName = actor?.name ?? null;
        }

        const message = buildSlackMessage(issue, event, actorName);

        if (webhookUrl) {
          await postToSlackWebhook(webhookUrl, message);
          sent++;
        } else {
          console.log("[slack dry-run] would send:", JSON.stringify(message));
          dryRun++;
        }
        handled = true;
      }
    } catch (error) {
      // 발송 전 실패 — 큐에 남겨 가시성 타임아웃 후 재시도
      failed++;
      console.error("slack-notify 메시지 처리 실패:", row.msg_id, error);
      continue;
    }

    if (handled) {
      // 삭제를 발송과 분리: 발송은 이미 성공했으므로, 삭제 실패는 처리 실패와 구분해 로깅한다.
      // (삭제 실패 시 재소비로 중복 발송 위험 — 근본 dedup은 2단계 slack_messages 기록으로)
      const { error: deleteError } = await supabase.rpc("pgmq_delete", {
        queue_name: QUEUE,
        msg_id: row.msg_id,
      });
      if (deleteError) {
        console.error(
          "발송 완료 후 큐 삭제 실패 — 재소비 시 중복 발송 위험:",
          row.msg_id,
          deleteError,
        );
      }
    }
  }

  return Response.json({ processed: rows.length, sent, dryRun, skipped, failed });
});
