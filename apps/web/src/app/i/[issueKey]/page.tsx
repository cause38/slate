import { IssueDetailView } from "@/components/issue/IssueDetailView";
import { GlobalModals } from "@/components/shared/GlobalModals";
import { Sidebar } from "@/components/shared/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type IssueDetailPageProps = {
  params: Promise<{ issueKey: string }>;
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { issueKey } = await params;
  const supabase = await createClient();

  const [{ data: issue }, { data: projects }] = await Promise.all([
    supabase.from("issues").select("key, project:projects(key)").eq("key", issueKey).maybeSingle(),
    supabase
      .from("projects")
      .select("id, key, name, color")
      .eq("is_archived", false)
      .order("created_at"),
  ]);

  if (!issue) notFound();
  const currentProjectKey = issue.project?.key;

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects ?? []} currentProjectKey={currentProjectKey} />
      <IssueDetailView issueKey={issueKey} />
      <GlobalModals />
    </div>
  );
}
