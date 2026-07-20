"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/queries/projects";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectSwitcherProps = {
  projects: Pick<Project, "id" | "key" | "name" | "color">[];
  currentProjectKey: string;
};

export function ProjectSwitcher({ projects, currentProjectKey }: ProjectSwitcherProps) {
  const router = useRouter();
  const current = projects.find((p) => p.key === currentProjectKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-xs hover:bg-muted">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: current?.color }} />
          {currentProjectKey}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => router.push(`/projects/${project.key}/board`)}
          >
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: project.color }} />
            <span className="font-medium">{project.key}</span>
            <span className="truncate text-muted-foreground">{project.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <span className="text-muted-foreground">홈으로</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
