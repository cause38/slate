"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type User, useManagedUsers, useUpdateUser } from "@/lib/queries/users";
import { toast } from "sonner";

type UserManagerProps = {
  currentUserId: string;
};

export function UserManager({ currentUserId }: UserManagerProps) {
  const { data: users } = useManagedUsers();
  const updateUser = useUpdateUser();

  const adminCount = (users ?? []).filter((u) => u.role === "admin" && u.is_active).length;

  function handleToggleRole(user: User) {
    // 마지막 활성 admin의 자기 강등 방지
    if (user.role === "admin" && adminCount <= 1) {
      toast.error("마지막 Admin은 강등할 수 없어요");
      return;
    }
    updateUser.mutate(
      { id: user.id, patch: { role: user.role === "admin" ? "member" : "admin" } },
      { onError: (e) => toast.error("역할 변경 실패", { description: msg(e) }) },
    );
  }

  function handleToggleActive(user: User) {
    if (user.id === currentUserId) {
      toast.error("본인 계정은 비활성화할 수 없어요");
      return;
    }
    if (user.role === "admin" && user.is_active && adminCount <= 1) {
      toast.error("마지막 Admin은 비활성화할 수 없어요");
      return;
    }
    updateUser.mutate(
      { id: user.id, patch: { is_active: !user.is_active } },
      { onError: (e) => toast.error("상태 변경 실패", { description: msg(e) }) },
    );
  }

  return (
    <div className="divide-y rounded-lg border bg-card">
      <div className="grid grid-cols-[1fr_200px_100px_140px] items-center px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
        <div>이름</div>
        <div>이메일</div>
        <div>역할</div>
        <div className="text-right">관리</div>
      </div>
      {(users ?? []).map((user) => (
        <div
          key={user.id}
          className="grid grid-cols-[1fr_200px_100px_140px] items-center px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className={user.is_active ? "" : "text-muted-foreground line-through"}>
              {user.name}
            </span>
            {user.id === currentUserId && (
              <span className="text-xs text-muted-foreground">(나)</span>
            )}
            {!user.is_active && <Badge variant="outline">비활성</Badge>}
          </div>
          <div className="truncate text-muted-foreground">{user.email}</div>
          <div>
            {user.role === "admin" ? (
              <Badge className="bg-purple-500/15 text-purple-500">Admin</Badge>
            ) : (
              <Badge variant="secondary">Member</Badge>
            )}
          </div>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleRole(user)}
              disabled={updateUser.isPending}
            >
              {user.role === "admin" ? "강등" : "승격"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleActive(user)}
              disabled={updateUser.isPending || user.id === currentUserId}
              className={user.is_active ? "text-destructive hover:text-destructive" : ""}
            >
              {user.is_active ? "비활성화" : "활성화"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function msg(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}
