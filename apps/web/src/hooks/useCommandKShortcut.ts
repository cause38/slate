"use client";

import { useEffect } from "react";

/**
 * ⌘K / Ctrl+K 전역 토글. 입력 필드 안에서도 팔레트를 열 수 있어야 하므로
 * useGlobalShortcut과 달리 typing 가드를 두지 않는다.
 */
export function useCommandKShortcut(handler: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler]);
}
