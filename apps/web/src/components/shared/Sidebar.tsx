"use client";

import { NotificationBell } from "@/components/shared/NotificationBell";
import { ProjectSwitcher } from "@/components/shared/ProjectSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { Project } from "@/lib/queries/projects";
import { useUiStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ProjectSummary = Pick<Project, "id" | "key" | "name" | "color">;

const PROJECT_NAV_ITEMS = [
  { segment: "board", label: "보드", icon: "▦" },
  { segment: "backlog", label: "백로그", icon: "≡" },
  { segment: "epics", label: "에픽", icon: "◇" },
  { segment: "reports", label: "리포트", icon: "▤" },
  { segment: "settings", label: "설정", icon: "⚙" },
] as const;

type SidebarProps = {
  projects: ProjectSummary[];
  /** 프로젝트 컨텍스트일 때만 지정. 없으면 홈 변형(프로젝트 목록) 렌더 */
  currentProjectKey?: string;
};

export function Sidebar({ projects, currentProjectKey }: SidebarProps) {
  const pathname = usePathname();
  // 검색·도움말은 지금까지 ⌘K 와 ? 로만 열 수 있어서, 단축키를 모르면 기능의 존재 자체를
  // 알 수 없었다. 화면에 진입점을 둔다.
  const setSearchOpen = useUiStore((state) => state.setSearchOpen);
  const setHelpOpen = useUiStore((state) => state.setHelpOpen);

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-foreground text-sm text-background">
            ◆
          </span>
          <span className="text-sm font-semibold">Slate</span>
        </Link>
        <NotificationBell />
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="mb-1 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">이슈 검색</span>
        <kbd className="font-mono text-[11px] text-muted-foreground/70">⌘K</kbd>
      </button>

      {currentProjectKey ? (
        <>
          <div className="mt-1 mb-2">
            <ProjectSwitcher projects={projects} currentProjectKey={currentProjectKey} />
          </div>
          {PROJECT_NAV_ITEMS.map(({ segment, label, icon }) => {
            const href = `/projects/${currentProjectKey}/${segment}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={segment}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </Link>
            );
          })}
        </>
      ) : (
        <>
          <div className="mt-2 px-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Projects
          </div>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.key}/board`}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-foreground/80 hover:bg-muted hover:text-foreground"
            >
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: project.color }} />
              {project.key}
            </Link>
          ))}
        </>
      )}

      <div className="mt-auto flex items-center gap-1 pt-2">
        <div className="min-w-0 flex-1">
          <ThemeToggle />
        </div>
        <button
          type="button"
          aria-label="단축키 도움말"
          title="단축키 도움말 (?)"
          onClick={() => setHelpOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[13px] text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          ?
        </button>
      </div>
    </aside>
  );
}
