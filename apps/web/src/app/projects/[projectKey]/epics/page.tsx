import { EpicsView } from "@/components/epic/EpicsView";
import { QuickCreateButton } from "@/components/shared/QuickCreateButton";
import { findProjectByKey } from "@/lib/queries/projects-server";
import { notFound } from "next/navigation";

type EpicsPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function EpicsPage({ params }: EpicsPageProps) {
  const { projectKey } = await params;
  const project = await findProjectByKey(projectKey);

  if (!project) notFound();

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{projectKey} 에픽</div>
          <div className="text-xs text-muted-foreground">소속 이슈와 진행률</div>
        </div>
        <QuickCreateButton />
      </div>
      <EpicsView projectId={project.id} />
    </main>
  );
}
