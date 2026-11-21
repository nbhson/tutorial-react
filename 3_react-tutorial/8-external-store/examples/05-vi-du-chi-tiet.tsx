// example.tsx — DAY 8: external store giỏ hàng (không cần lib)
// Một ví dụ duy nhất: state nằm NGOÀI React, component subscribe để đọc.
import { useSyncExternalStore } from "react";

type CartItem = { id: number; name: string };

let nextId = 1; // id tăng dần — không hiển thị nên không cần báo subscriber

// Store ngoài React — giống Service singleton + BehaviorSubject của Angular
const cartStore = {
  items: [] as CartItem[], // nguồn dữ liệu thật
  listeners: new Set<() => void>(), // danh sách subscriber
  subscribe(fn: () => void) {
    // contract của useSyncExternalStore: đăng ký + trả hàm hủy
    cartStore.listeners.add(fn);
    return () => {
      cartStore.listeners.delete(fn); // React gọi khi unmount — chống leak
    };
  },
  getSnapshot() {
    return cartStore.items; // trả giá trị hiện tại để React so sánh
  },
  add(name: string) {
    // bất biến: mảng mới — giữ tham chiếu cũ khi không đổi để selector so được
    cartStore.items = [...cartStore.items, { id: nextId++, name }];
    cartStore.listeners.forEach((l) => l()); // báo subscriber kiểm tra lại
  },
  clear() {
    cartStore.items = [];
    cartStore.listeners.forEach((l) => l());
  },
};

// Hook đọc có selector: mỗi component chọn đúng "lát" cần.
// React so lát đã lọc bằng Object.is — lát không đổi thì bỏ qua re-render.
function useCartStore<T>(selector: (items: CartItem[]) => T): T {
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getSnapshot()));
}

function CartCount() {
  const count = useCartStore((s) => s.length); // lát số lượng: thêm hàng mới render lại
  return <p>Giỏ hàng: {count} món</p>;
}

function CartList() {
  const items = useCartStore((s) => s); // lát cả mảng: cùng tham chiếu thì đứng yên
  if (items.length === 0) return <p>Giỏ trống.</p>;
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id}>{i.name}</li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <>
      <CartCount />
      <CartList />
      <button onClick={() => cartStore.add(`Hàng ${nextId}`)}>Thêm hàng</button>
      <button onClick={() => cartStore.clear()}>Xóa giỏ</button>
    </>
  );
}
