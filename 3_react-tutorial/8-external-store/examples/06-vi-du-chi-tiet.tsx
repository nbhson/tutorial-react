// Zustand (prod): cùng module với trên, cài `npm i zustand`
import { create } from "zustand";

type CartState = { items: string[]; add: (item: string) => void; clear: () => void };
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // bất biến: mảng mới
  clear: () => set({ items: [] }),
}));

// Component chỉ subscribe đúng slice -> ít re-render (so Object.is lát):
function CartCount() {
  const count = useCart((s) => s.items.length); // slice số lượng
  return <p>Giỏ hàng: {count}</p>;
}
// Đọc ngoài React: useCart.getState().add("Hàng A") — tiện nhưng kỷ luật để tránh global ẩn.
