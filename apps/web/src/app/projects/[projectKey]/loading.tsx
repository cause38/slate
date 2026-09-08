// 이 경계 바깥(레이아웃)이 이미 사이드바를 렌더하므로 본문 자리만 잡는다.
const ROW_PLACEHOLDER_KEYS = ["a", "b", "c", "d", "e"];

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
      {ROW_PLACEHOLDER_KEYS.map((key) => (
        <div key={key} className="h-10 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
