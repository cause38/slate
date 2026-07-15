import { SignOutButton } from "@/components/auth/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata.full_name as string | undefined) ?? user?.email ?? "게스트";

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">안녕하세요, {displayName} 👋</h1>
        <SignOutButton />
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">프로젝트</h2>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          프로젝트 카드 리스트 — W2에서 구현 예정
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">내 담당 이슈</h2>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          담당 이슈 통합 뷰 — W2에서 구현 예정
        </div>
      </section>
    </main>
  );
}
