// Client state (DAY 8 external-store + nhóm 1: tách server/client state).
// - Server state (posts) -> TanStack Query cache, KHÔNG để trong Zustand.
// - Zustand chỉ giữ UI state: search, notice. Nhẹ, không prop-drilling.

import { create } from "zustand";

interface UiState {
  search: string;
  notice: string | null;
  setSearch: (q: string) => void;
  flash: (message: string) => void;
  clearNotice: () => void;
}

let timer: number | undefined;

export const useUiStore = create<UiState>()((set) => ({
  search: "",
  notice: null,
  setSearch: (q) => set({ search: q }),
  flash: (message) => {
    set({ notice: message });
    window.clearTimeout(timer);
    timer = window.setTimeout(() => set({ notice: null }), 3000);
  },
  clearNotice: () => set({ notice: null }),
}));
