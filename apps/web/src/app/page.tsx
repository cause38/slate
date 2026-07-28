import { SignOutButton } from "@/components/auth/SignOutButton";
import { StatusPill } from "@/components/issue/StatusPill";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { GlobalModals } from "@/components/shared/GlobalModals";
import { QuickCreateButton } from "@/components/shared/QuickCreateButton";
import { Sidebar } from "@/components/shared/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { IssueStatus } from "@/lib/constants";
import { formatShortDate } from "@/lib/date";
import { fetchMyIssues } from "@/lib/queries/issues-shared";
import { isCurrentUserAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: projects, error: projectsError }, myIssues, isAdmin] = await Promise.all([
    supabase
      .from("projects")
      .select("id, key, name, color, issues(count)")
      .eq("is_archived", false)
      .order("created_at"),
    user ? fetchMyIssues(supabase, user.id) : [],
    isCurrentUserAdmin(supabase),
  ]);
  if (projectsError) throw projectsError;

  const displayName =
    (user?.user_metadata.full_name as string | undefined) ?? user?.email ?? "게스트";
  const initial = displayName.slice(0, 1);

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects ?? []} />

      <main className="min-w-0 flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">안녕하세요, {displayName} 👋</h1>
          <div className="flex items-center gap-2">
            <QuickCreateButton />
            <SignOutButton />
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={(user?.user_metadata.avatar_url as string | undefined) ?? undefined}
              />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold">프로젝트</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(projects ?? []).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.key}/board`}
                className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted"
              >
                <div className="h-[3px]" style={{ backgroundColor: project.color }} />
                <div className="p-3">
                  <Badge variant="secondary" className="mb-1.5 font-mono text-[11px]">
                    {project.key}
                  </Badge>
                  <div className="text-sm font-medium">{project.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {project.issues?.[0]?.count ?? 0} issues
                  </div>
                </div>
              </Link>
            ))}
            {isAdmin && <CreateProjectDialog />}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">내 담당 이슈</h2>
          {myIssues.length ? (
            <div className="divide-y rounded-lg border bg-card">
              {myIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/i/${issue.key}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <StatusPill status={issue.status as IssueStatus} />
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                    {issue.key}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
                  {issue.story_points !== null && (
                    <Badge variant="outline" className="rounded-full">
                      {issue.story_points} pt
                    </Badge>
                  )}
                  <span className="w-14 text-right text-xs text-muted-foreground">
                    {issue.due_date ? `~ ${formatShortDate(issue.due_date)}` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              담당 중인 이슈가 없어요
            </div>
          )}
        </section>
      </main>
      <GlobalModals />
    </div>
  );
}
