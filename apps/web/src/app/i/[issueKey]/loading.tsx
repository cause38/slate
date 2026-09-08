// 이슈 상세는 자체 사이드바를 렌더하는 페이지라 전체 셸이 필요하다.
const NAV_PLACEHOLDER_WIDTHS = ["w-16", "w-20", "w-14", "w-20", "w-12"];

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col gap-2 border-r bg-card p-3">
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-8 w-full animate-pulse rounded-md bg-muted" />
        {NAV_PLACEHOLDER_WIDTHS.map((width) => (
          <div key={width} className={`h-6 ${width} animate-pulse rounded bg-muted`} />
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
