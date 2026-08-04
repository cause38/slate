import { GlobalSearchModal } from "@/components/shared/GlobalSearchModal";
import { QuickCreateModal } from "@/components/shared/QuickCreateModal";
import { ShortcutsHelpDialog } from "@/components/shared/ShortcutsHelpDialog";

/** 전역 오버레이(빠른 생성 C / 이슈 검색 ⌘K / 단축키 도움말 ?)를 한 곳에서 마운트 */
export function GlobalModals() {
  return (
    <>
      <QuickCreateModal />
      <GlobalSearchModal />
      <ShortcutsHelpDialog />
    </>
  );
}
