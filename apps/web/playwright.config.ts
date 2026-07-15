import { defineConfig, devices } from "@playwright/test";

// Supabase 미연결 상태에서도 라우팅/렌더 테스트가 돌도록 더미 env 주입.
// 실제 OAuth 플로우 E2E는 Supabase 프로젝트 연결 후 .env.local 값으로 대체.
const supabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "dummy-anon-key",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    // 3000은 로컬에서 다른 앱과 충돌할 수 있어 E2E 전용 포트 사용
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    env: supabaseEnv,
  },
});
