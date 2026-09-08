"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// 서버 컴포넌트가 throw 하면(예: projects 조회 실패) 이 경계가 없을 때 Next 기본 오류 화면으로
// 떨어져 앱으로 돌아갈 경로가 사라진다. digest 는 서버 로그와 대조할 수 있는 유일한 단서라 노출한다.
export default function GlobalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">문제가 생겼어요</h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요. 계속 이러면 아래 코드를 알려주세요.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/70">{error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>
          다시 시도
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </main>
  );
}
