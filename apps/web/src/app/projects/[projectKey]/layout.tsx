import { Sidebar } from "@/components/shared/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectKey: string }>;
};

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectKey } = await params;
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, key, name, color")
    .eq("is_archived", false)
    .order("created_at");

  const current = projects?.find((p) => p.key === projectKey);
  if (!current) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects ?? []} currentProjectKey={projectKey} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
