"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type User = Tables<"users">;
export type UserRole = User["role"];

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
  managed: () => [...userKeys.all, "managed"] as const,
  current: () => [...userKeys.all, "current"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

/** 활성 사용자만 — 담당자 선택 등 일반 용도 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async (): Promise<User[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** 비활성 포함 전체 사용자 — 워크스페이스 사용자 관리(Admin)용 */
export function useManagedUsers() {
  return useQuery({
    queryKey: userKeys.managed(),
    queryFn: async (): Promise<User[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("users").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: { role?: UserRole; is_active?: boolean };
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("users").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useCurrentUserId() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<string | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
  });
}

/** 현재 로그인 사용자의 프로필(role 포함) — admin 게이팅 판별용 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async (): Promise<User | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin() {
  const { data } = useCurrentUser();
  return data?.role === "admin";
}
