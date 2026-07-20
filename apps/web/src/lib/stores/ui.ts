"use client";

import { create } from "zustand";

type UiState = {
  quickCreateOpen: boolean;
  openQuickCreate: () => void;
  closeQuickCreate: () => void;
  setQuickCreateOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  quickCreateOpen: false,
  openQuickCreate: () => set({ quickCreateOpen: true }),
  closeQuickCreate: () => set({ quickCreateOpen: false }),
  setQuickCreateOpen: (open) => set({ quickCreateOpen: open }),
}));
