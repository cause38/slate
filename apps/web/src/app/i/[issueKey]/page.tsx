import { IssueDetailView } from "@/components/issue/IssueDetailView";
import { GlobalModals } from "@/components/shared/GlobalModals";
import { Sidebar } from "@/components/shared/Sidebar";
import { fetchActiveProjects } from "@/lib/queries/projects-server";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type IssueDetailPageProps = {
  params: Promise<{ issueKey: string }>;
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { issueKey } = await params;
  const supabase = await createClient();

  const [{ data: issue }, projects] = await Promise.all([
    supabase.from("issues").select("key, project:projects(key)").eq("key", issueKey).maybeSingle(),
    fetchActiveProjects(),
  ]);

  if (!issue) notFound();
  const currentProjectKey = issue.project?.key;

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} currentProjectKey={currentProjectKey} />
      <IssueDetailView issueKey={issueKey} />
      <GlobalModals />
    </div>
  );
}
