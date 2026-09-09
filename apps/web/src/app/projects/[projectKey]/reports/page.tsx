import { ReportsView } from "@/components/report/ReportsView";
import { QuickCreateButton } from "@/components/shared/QuickCreateButton";
import { findProjectByKey } from "@/lib/queries/projects-server";
import { notFound } from "next/navigation";

type ReportsPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { projectKey } = await params;
  const project = await findProjectByKey(projectKey);

  if (!project) notFound();

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{projectKey} 리포트</div>
          <div className="text-xs text-muted-foreground">스프린트 요약 · 벨로시티</div>
        </div>
        <QuickCreateButton />
      </div>
      <ReportsView projectId={project.id} />
    </main>
  );
}
