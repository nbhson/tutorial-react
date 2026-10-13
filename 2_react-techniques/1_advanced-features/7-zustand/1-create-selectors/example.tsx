import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

// Store giỏ: state + action trong cùng type, set bất biến
type CartState = {
  items: string[];
  add: (item: string) => void; // action tham chiếu ổn định — con memo không miss
  clear: () => void;
};
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // function form: state mới nhất
  clear: () => set({ items: [] }),
}));

// Đọc đúng lát: số lượng là nguyên thủy — đổi số mới render lại
export function CartCount() {
  const count = useCart((s) => s.items.length);
  return <p>Giỏ: {count}</p>;
}

// Đọc 2 field cùng lúc: useShallow so nông — giá trị không đổi thì đứng yên
export function CartActions() {
  const { add, clear } = useCart(useShallow((s) => ({ add: s.add, clear: s.clear })));
  return (
    <>
      <button onClick={() => add('Bút')}>Thêm bút</button>
      <button onClick={clear}>Xóa</button>
    </>
  );
}

// Ngoài React, không hook vẫn đọc/ghi được — subscriber nhận báo bình thường:
// useCart.getState().add('Vở');
