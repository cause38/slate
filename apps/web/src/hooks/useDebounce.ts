"use client";

import { useEffect, useState } from "react";

/** value가 delayMs 동안 안정되면 그 값을 반환 (검색어 등 고빈도 입력 완화) */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
