"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 여러 명이 같이 쓰면 남의 변경이 내 화면에 안 들어온다. 원래는 Realtime 구독이
            // 무효화를 맡는다는 전제로 껐는데, 그 구독은 끝내 만들어지지 않았다.
            // Realtime 은 도입하지 않기로 했으므로 탭 복귀 시 재조회로 메운다.
            refetchOnWindowFocus: true,
            staleTime: 30_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
