import { Button } from "@/components/ui/button";
import Link from "next/link";

// 루트 레이아웃은 Provider 와 Toaster 만 렌더해서 링크가 하나도 없다. 이 화면이 없으면
// Next 기본 404 로 떨어지고, 거기엔 앱으로 돌아갈 경로가 아예 없어 뒤로가기밖에 답이 없다.
// notFound() 는 프로젝트 레이아웃(잘못된 키)·이슈 상세(없는 이슈)에서도 여기로 온다.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <div className="font-mono text-5xl font-semibold text-muted-foreground/40">404</div>
        <h1 className="text-lg font-semibold">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted-foreground">주소가 바뀌었거나, 삭제된 이슈일 수 있어요.</p>
      </div>
      <Button asChild size="sm">
        <Link href="/">홈으로</Link>
      </Button>
    </main>
  );
}
