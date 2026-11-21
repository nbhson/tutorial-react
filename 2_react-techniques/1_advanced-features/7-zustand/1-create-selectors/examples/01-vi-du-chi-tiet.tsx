import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

type CartState = {
  items: string[];
  add: (item: string) => void; // action trong store — tham chiếu ổn định
  clear: () => void;
};
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // bất biến: mảng mới
  clear: () => set({ items: [] }),
}));

// Đọc đúng lát — mỗi component một selector nhỏ:
export function CartCount() {
  const count = useCart((s) => s.items.length); // nguyên thủy: đổi số mới render
  return <p>Giỏ: {count}</p>;
}
export function CartActions() {
  const { add, clear } = useCart(
    useShallow((s) => ({ add: s.add, clear: s.clear })), // 2 field: so nông, không render thừa
  );
  return (
    <>
      <button onClick={() => add('Bút')}>Thêm bút</button>
      <button onClick={clear}>Xóa</button>
    </>
  );
}
// Ngoài React (không hook): useCart.getState().add('Vở'); — subscriber vẫn nhận báo
