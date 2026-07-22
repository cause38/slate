import { BoardView } from "@/components/board/BoardView";
import { QuickCreateButton } from "@/components/shared/QuickCreateButton";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type BoardPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectKey } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, key")
    .eq("key", projectKey)
    .maybeSingle();

  if (!project) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{projectKey} 보드</div>
          <div className="text-xs text-muted-foreground">Active 스프린트 칸반</div>
        </div>
        <QuickCreateButton />
      </div>
      <BoardView projectId={project.id} projectKey={project.key} />
    </main>
  );
}
