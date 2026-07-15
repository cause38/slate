import { expect, test } from "@playwright/test";

test.describe("인증 라우팅", () => {
  test("비로그인 사용자는 홈 접근 시 /login으로 리디렉트된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("로그인 페이지에 Google 로그인 버튼이 보인다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Slate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByText("@bbodek.com 도메인만 가입할 수 있어요")).toBeVisible();
  });

  // TODO(W1 마무리): Supabase 프로젝트 연결 + Google OAuth 설정 후
  // 실제 "로그인 → 홈 이동" 플로우 테스트로 확장 (테스트 세션 주입 방식)
});
