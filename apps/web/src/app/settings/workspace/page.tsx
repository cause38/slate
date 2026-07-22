import { UserManager } from "@/components/settings/UserManager";
import { Sidebar } from "@/components/shared/Sidebar";
import { getSessionUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient();
  const [sessionUser, { data: projects }] = await Promise.all([
    getSessionUser(supabase),
    supabase
      .from("projects")
      .select("id, key, name, color")
      .eq("is_archived", false)
      .order("created_at"),
  ]);

  // 워크스페이스 설정은 Admin 전용 (UI 게이팅; DB는 users RLS가 방어)
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "admin") redirect("/");
  const currentUserId = sessionUser.id;

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects ?? []} />
      <main className="min-w-0 flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-semibold">워크스페이스 설정</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            @bbodek.com 가입자 목록. Admin 승격·강등, 비활성화를 관리해요.
          </p>

          <section>
            <h2 className="mb-3 text-sm font-semibold">사용자 관리</h2>
            <UserManager currentUserId={currentUserId} />
          </section>
        </div>
      </main>
    </div>
  );
}
