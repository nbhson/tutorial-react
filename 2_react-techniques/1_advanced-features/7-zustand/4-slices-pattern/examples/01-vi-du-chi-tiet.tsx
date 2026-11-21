import { create, type StateCreator } from 'zustand';

// Mỗi slice một type + một creator — file riêng: cartSlice.ts, uiSlice.ts
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

// Store duy nhất gộp slice — thêm middleware (bài 3) bọc ngoài dòng này
export const useStore = create<State>()((...a) => ({ ...cartSlice(...a), ...uiSlice(...a) }));

// Hook theo domain — component đọc đúng domain mình cần:
export const useCartItems = () => useStore((s) => s.items); // CartCount dùng cái này
export const useSidebar = () => useStore((s) => s.sidebarOpen); // Header dùng cái này
