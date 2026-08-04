import { describe, expect, it } from "vitest";
// Edge Function의 순수 매핑 모듈 (런타임 의존 없어 Node에서 테스트 가능)
import {
  type JiraIssue,
  type SlateUserRef,
  mapJiraIssue,
} from "../../../../supabase/functions/_shared/jira-map";

const usersByEmail = new Map<string, SlateUserRef>([
  ["jj.park@bbodek.com", { id: "u-jj", email: "jj.park@bbodek.com", name: "박진주" }],
]);

function jira(over: Partial<JiraIssue["fields"]>, key = "DOTOLI-1"): JiraIssue {
  return {
    key,
    fields: {
      summary: "제목",
      issuetype: { name: "작업" },
      status: { name: "할 일", statusCategory: { key: "new" } },
      priority: { name: "Medium" },
      reporter: { emailAddress: "jj.park@bbodek.com" },
      assignee: null,
      labels: [],
      ...over,
    },
  };
}

describe("mapJiraIssue", () => {
  it("타입/상태/우선순위를 Slate 값으로 매핑", () => {
    const r = mapJiraIssue(
      jira({
        issuetype: { name: "버그" },
        status: { name: "완료", statusCategory: { key: "done" } },
        priority: { name: "High" },
      }),
      usersByEmail,
    );
    expect(r.mapped.type).toBe("bug");
    expect(r.mapped.status).toBe("done");
    expect(r.mapped.priority).toBe("high");
    expect(r.level).toBe("ok");
  });

  it("에픽·스토리·하위작업 타입 매핑", () => {
    expect(mapJiraIssue(jira({ issuetype: { name: "에픽" } }), usersByEmail).mapped.type).toBe(
      "epic",
    );
    expect(mapJiraIssue(jira({ issuetype: { name: "스토리" } }), usersByEmail).mapped.type).toBe(
      "story",
    );
    expect(mapJiraIssue(jira({ issuetype: { name: "하위 작업" } }), usersByEmail).mapped.type).toBe(
      "task",
    );
  });

  it("검토 상태명은 in_review로 보정", () => {
    const r = mapJiraIssue(
      jira({ status: { name: "In Review", statusCategory: { key: "indeterminate" } } }),
      usersByEmail,
    );
    expect(r.mapped.status).toBe("in_review");
  });

  it("email 매칭되는 보고자·담당자는 Slate id로", () => {
    const r = mapJiraIssue(
      jira({ assignee: { emailAddress: "jj.park@bbodek.com" } }),
      usersByEmail,
    );
    expect(r.mapped.reporter_id).toBe("u-jj");
    expect(r.mapped.assignee_id).toBe("u-jj");
  });

  it("보고자 email 미노출(privacy)이면 fail", () => {
    const r = mapJiraIssue(jira({ reporter: { displayName: "김수민" } }), usersByEmail);
    expect(r.mapped.reporter_id).toBeNull();
    expect(r.level).toBe("fail");
  });

  it("담당자 미매칭은 warn(미지정)", () => {
    const r = mapJiraIssue(jira({ assignee: { displayName: "김수민" } }), usersByEmail);
    expect(r.mapped.assignee_id).toBeNull();
    expect(r.level).toBe("warn");
  });

  it("본문/라벨은 info라 level을 올리지 않음(ok 유지)", () => {
    const r = mapJiraIssue(jira({ description: "본문 있음", labels: ["frontend"] }), usersByEmail);
    expect(r.level).toBe("ok");
    expect(r.notes.length).toBeGreaterThan(0); // 노트는 표시됨
  });

  it("미상 타입/우선순위는 fallback + warn", () => {
    const r = mapJiraIssue(
      jira({ issuetype: { name: "알수없음" }, priority: { name: "Trivial" } }),
      usersByEmail,
    );
    expect(r.mapped.type).toBe("task");
    expect(r.mapped.priority).toBe("medium");
    expect(r.level).toBe("warn");
  });
});
