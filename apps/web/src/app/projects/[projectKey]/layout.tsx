import { GlobalModals } from "@/components/shared/GlobalModals";
import { Sidebar } from "@/components/shared/Sidebar";
import { fetchActiveProjects } from "@/lib/queries/projects-server";
import { notFound } from "next/navigation";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectKey: string }>;
};

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectKey } = await params;
  const projects = await fetchActiveProjects();
  const current = projects.find((p) => p.key === projectKey);
  if (!current) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} currentProjectKey={projectKey} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <GlobalModals />
    </div>
  );
}
