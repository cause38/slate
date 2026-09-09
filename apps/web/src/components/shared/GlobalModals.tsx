"use client";

import { useCommandKShortcut } from "@/hooks/useCommandKShortcut";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { useUiStore } from "@/lib/stores/ui";
import dynamic from "next/dynamic";

// 모달 3종은 모든 페이지에 항상 마운트돼 있었다. 빠른 생성 모달은 닫혀 있어도 프로젝트·
// 사용자·현재사용자 쿼리 3개를 쏘고, 셋 다 초기 번들에 실렸다. 열릴 때만 불러온다.
//
// 단축키는 모달 안에 있었기 때문에 그대로 지연 로딩하면 c·⌘K·? 가 죽는다.
// 등록을 여기로 올려서 모달이 없어도 열쇠는 항상 살아 있게 한다.
const QuickCreateModal = dynamic(() =>
  import("@/components/shared/QuickCreateModal").then((m) => m.QuickCreateModal),
);
const GlobalSearchModal = dynamic(() =>
  import("@/components/shared/GlobalSearchModal").then((m) => m.GlobalSearchModal),
);
const ShortcutsHelpDialog = dynamic(() =>
  import("@/components/shared/ShortcutsHelpDialog").then((m) => m.ShortcutsHelpDialog),
);

/** 전역 오버레이(빠른 생성 C / 이슈 검색 ⌘K / 단축키 도움말 ?)를 한 곳에서 마운트 */
export function GlobalModals() {
  const quickCreateOpen = useUiStore((state) => state.quickCreateOpen);
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const searchOpen = useUiStore((state) => state.searchOpen);
  const toggleSearch = useUiStore((state) => state.toggleSearch);
  const helpOpen = useUiStore((state) => state.helpOpen);
  const toggleHelp = useUiStore((state) => state.toggleHelp);

  useGlobalShortcut("c", openQuickCreate);
  useCommandKShortcut(toggleSearch);
  // ?(Shift+/)로 토글 — useGlobalShortcut이 입력 필드 안에서는 무시
  useGlobalShortcut("?", toggleHelp);

  return (
    <>
      {quickCreateOpen && <QuickCreateModal />}
      {searchOpen && <GlobalSearchModal />}
      {helpOpen && <ShortcutsHelpDialog />}
    </>
  );
}
