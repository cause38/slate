type BoardPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectKey } = await params;

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b bg-card px-4 py-3">
        <div className="text-sm font-semibold">{projectKey} 보드</div>
        <div className="text-xs text-muted-foreground">Active 스프린트 칸반 — W3에서 구현</div>
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        스프린트 · 칸반 보드는 W3에서 구현됩니다
      </div>
    </main>
  );
}
