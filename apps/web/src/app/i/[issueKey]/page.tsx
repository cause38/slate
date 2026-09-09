import { IssueDetailView } from "@/components/issue/IssueDetailView";
import { GlobalModals } from "@/components/shared/GlobalModals";
import { Sidebar } from "@/components/shared/Sidebar";
import { fetchIssueDetail, issueDetailKey } from "@/lib/queries/issue-detail-shared";
import { fetchActiveProjects } from "@/lib/queries/projects-server";
import { createClient } from "@/lib/supabase/server";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";

type IssueDetailPageProps = {
  params: Promise<{ issueKey: string }>;
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { issueKey } = await params;
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // 예전에는 서버가 존재 확인용으로 이슈를 한 번 읽고, 브라우저가 상세를 처음부터 다시 읽었다.
  // 그 사이 화면에는 "불러오는 중…"만 남았다. 서버에서 상세를 그대로 받아 하이드레이션으로
  // 넘기면 첫 렌더에 내용이 들어차고, fetchQuery 가 실패로 던지므로 없는 이슈 판정도 같이 끝난다.
  const [issue, projects] = await Promise.all([
    queryClient
      .fetchQuery({
        queryKey: issueDetailKey(issueKey),
        queryFn: () => fetchIssueDetail(supabase, issueKey),
      })
      .catch(() => null),
    fetchActiveProjects(),
  ]);

  if (!issue) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} currentProjectKey={issue.project?.key} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <IssueDetailView issueKey={issueKey} />
      </HydrationBoundary>
      <GlobalModals />
    </div>
  );
}
