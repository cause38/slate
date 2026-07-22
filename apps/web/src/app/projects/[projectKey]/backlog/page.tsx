import { QuickCreateButton } from "@/components/shared/QuickCreateButton";
import { BacklogView } from "@/components/sprint/BacklogView";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type BacklogPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { projectKey } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("key", projectKey)
    .maybeSingle();

  if (!project) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <div className="text-sm font-semibold">백로그</div>
          <div className="text-xs text-muted-foreground">스프린트 계획과 백로그 관리</div>
        </div>
        <QuickCreateButton />
      </div>
      <BacklogView projectId={project.id} />
    </main>
  );
}
