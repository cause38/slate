"use client";

import { create } from "zustand";

type UiState = {
  quickCreateOpen: boolean;
  openQuickCreate: () => void;
  closeQuickCreate: () => void;
  setQuickCreateOpen: (open: boolean) => void;
  searchOpen: boolean;
  closeSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  quickCreateOpen: false,
  openQuickCreate: () => set({ quickCreateOpen: true }),
  closeQuickCreate: () => set({ quickCreateOpen: false }),
  setQuickCreateOpen: (open) => set({ quickCreateOpen: open }),
  searchOpen: false,
  closeSearch: () => set({ searchOpen: false }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
}));
