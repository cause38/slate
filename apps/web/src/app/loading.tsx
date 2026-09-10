// 서버 왕복이 끝날 때까지 HTML 이 한 바이트도 안 나가면 클릭 후 흰 화면만 길게 남는다.
// 배포본은 함수가 미국에서 도는 동안 그 시간이 전부 TTFB 로 노출되므로 셸을 먼저 흘려보낸다.
// 홈과 이슈 상세는 각자 사이드바를 렌더하므로 여기서도 사이드바 자리를 잡아둔다.
// key 로 쓸 수 있게 id 를 따로 둔다. 폭 문자열은 값이 겹칠 수 있어 key 로 쓰면 안 된다.
const NAV_PLACEHOLDERS = [
  { id: "nav-1", width: "w-16" },
  { id: "nav-2", width: "w-20" },
  { id: "nav-3", width: "w-14" },
  { id: "nav-4", width: "w-20" },
  { id: "nav-5", width: "w-12" },
];

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col gap-2 border-r bg-card p-3">
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-8 w-full animate-pulse rounded-md bg-muted" />
        {NAV_PLACEHOLDERS.map(({ id, width }) => (
          <div key={id} className={`h-6 ${width} animate-pulse rounded bg-muted`} />
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
