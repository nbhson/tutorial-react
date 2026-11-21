// Zustand prod (cài npm i zustand) — cùng ý với store tự viết nhưng gọn + tối ưu sẵn:
import { create } from "zustand";
type CartState = { items: string[]; add: (item: string) => void; clear: () => void };
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // bất biến qua set
  clear: () => set({ items: [] }),
}));
function CartCount() {
  const count = useCart((s) => s.items.length); // selector: chỉ slice này đổi mới render
  return <p>Giỏ hàng: {count}</p>;
}
