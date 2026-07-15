"use client";

import { Button } from "@/components/ui/button";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: `@${ALLOWED_EMAIL_DOMAIN} 계정으로만 로그인할 수 있어요.`,
  auth_failed: "로그인에 실패했어요. 다시 시도해주세요.",
  signup_failed: "가입 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
};

type LoginCardProps = {
  errorCode?: string;
};

export function LoginCard({ errorCode }: LoginCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthFailed, setOauthFailed] = useState(false);
  const activeErrorCode = oauthFailed ? "auth_failed" : errorCode;
  const errorMessage = activeErrorCode
    ? (ERROR_MESSAGES[activeErrorCode] ?? ERROR_MESSAGES.auth_failed)
    : null;

  async function handleGoogleLogin() {
    setIsLoading(true);
    setOauthFailed(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: ALLOWED_EMAIL_DOMAIN },
      },
    });
    // 성공 시엔 곧 구글로 리디렉트되므로 error일 때만 상태 복구
    if (error) {
      setOauthFailed(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-[380px] rounded-xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-foreground text-2xl text-background">
        ◆
      </div>
      <h1 className="mb-1 text-xl font-semibold">Slate</h1>
      <p className="mb-6 text-sm text-muted-foreground">사내 이슈 트래커</p>
      <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? "이동 중…" : "Continue with Google"}
      </Button>
      {errorMessage ? (
        <p className="mt-4 text-xs text-destructive">{errorMessage}</p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          @{ALLOWED_EMAIL_DOMAIN} 도메인만 가입할 수 있어요
        </p>
      )}
    </div>
  );
}
