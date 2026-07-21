import { LabelManager } from "@/components/settings/LabelManager";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type ProjectSettingsPageProps = {
  params: Promise<{ projectKey: string }>;
};

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { projectKey } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, key, name")
    .eq("key", projectKey)
    .maybeSingle();

  if (!project) notFound();

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold">{project.name} 설정</h1>
        <p className="mb-6 text-sm text-muted-foreground">프로젝트 라벨을 관리해요.</p>

        <section>
          <h2 className="mb-3 text-sm font-semibold">라벨</h2>
          <LabelManager projectId={project.id} />
        </section>
      </div>
    </main>
  );
}
