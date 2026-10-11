import { create, type StateCreator } from 'zustand';

// Mỗi domain một type + creator — thực tế đặt file riêng: cartSlice.ts, uiSlice.ts
type CartSlice = { items: string[]; add: (i: string) => void };
type UiSlice = { sidebarOpen: boolean; toggle: () => void };
type State = CartSlice & UiSlice; // gộp bằng intersection

const cartSlice: StateCreator<State, [], [], CartSlice> = (set) => ({
  items: [],
  add: (i) => set((s) => ({ items: [...s.items, i] })),
});
const uiSlice: StateCreator<State, [], [], UiSlice> = (set) => ({
  sidebarOpen: false,
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
});

// Một store duy nhất gộp slice — middleware (bài 3) bọc ngoài dòng này
export const useStore = create<State>()((...a) => ({ ...cartSlice(...a), ...uiSlice(...a) }));

// Hook theo domain: component đọc đúng domain, không cần biết chung một gốc
export const useCartItems = () => useStore((s) => s.items); // CartCount dùng cái này
export const useSidebar = () => useStore((s) => s.sidebarOpen); // Header dùng cái này

// Action liên domain đọc qua get() — không import slice chéo (tránh import vòng):
// checkout: () => { const { items } = get(); if (get().sidebarOpen) ... }
