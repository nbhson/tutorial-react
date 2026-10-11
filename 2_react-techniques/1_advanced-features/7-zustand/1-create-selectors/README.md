# Create + Selectors — Lõi Zustand

> Nguồn: https://zustand.docs.pmnd.rs/getting-started/introduction

## Mục tiêu
- Tạo store bằng `create` đúng cú pháp curried TypeScript.
- Đọc đúng slice bằng selector, hiểu `Object.is` quyết định re-render.
- Dùng `useShallow` cho selector nhiều field; đọc/ghi ngoài React bằng `getState`/`setState`.

## Khái niệm cốt lõi
- **`create<T>()((set, get) => ...)`**: cặp `()` thứ hai bắt buộc để TypeScript suy kiểu. `set` ghi bất biến, `get` đọc state hiện tại trong action.
- **Selector**: `useCart((s) => s.items.length)` — component subscribe đúng lát; Zustand so kết quả bằng `Object.is`, khác mới re-render.
- **Không selector = re-render mọi thay đổi**: `useCart()` trần subscribe cả store — field nào đổi cũng render lại.
- **`useShallow(selector)`**: so sánh nông object/mảng trả về — `{ a, b }` cùng giá trị thì không render lại dù tham chiếu mới.
- **Đọc ngoài React**: `useCart.getState().items` (event handler, non-React code), `useCart.setState(...)` ghi trực tiếp — tiện nhưng kỷ luật, tránh "global ẩn".
- **Action ổn định tham chiếu**: function trong store tạo một lần — truyền xuống con `memo` không gây miss như callback inline.

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `set((s) => ...)` dạng function: đọc state mới nhất — an toàn khi nhiều `add` dồn trong cùng event (batch).
- `useShallow` bọc ngoài selector object — không có nó, `{ add, clear }` mới mỗi lần gọi là render lại mãi.
- Action trong store (`add`/`clear`) tham chiếu không đổi suốt đời store — khác `useCallback` phải memo tay.
- `getState()` ngoài React vẫn trigger subscriber — store không phân biệt ai gọi, chỉ báo đổi.

## Lỗi thường gặp
- **Mutate trong `set`** (`s.items.push(x)`) → tham chiếu cũ, subscriber không thấy, UI "đơ". Fix: luôn mảng/object mới.
- **Selector `.filter`/object literal không `useShallow`** → mảng mới mỗi lần → re-render vô hạn. Fix: nguyên thủy hoặc `useShallow`.
- **`useCart()` trần ở component lớn** → đổi field nào cũng render cả cây con. Fix: tách selector nhỏ, tách component đọc riêng.
- **Lưu derived (tổng tiền) vào store** → lệch khi items đổi mà quên tính lại. Fix: `useCart((s) => s.items.reduce(...))` tính lúc đọc.

## Reference
- [Zustand — Getting started](https://zustand.docs.pmnd.rs/getting-started/introduction)
