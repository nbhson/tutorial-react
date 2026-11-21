import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type CartState = { items: { id: number; qty: number }[]; lastSync: number | null };
export const useCart = create<CartState>()(
  devtools( // ngoài cùng: DevTools thấy state cuối sau mọi middleware
    persist(
      immer((set) => ({ // immer: mutate draft cho state lồng
        items: [],
        lastSync: null,
      })),
      {
        name: 'cart', // key localStorage
        partialize: (s) => ({ items: s.items }) as CartState, // chỉ giữ items — bỏ lastSync
        version: 1, // đổi shape thì tăng + thêm migrate
      },
    ),
    { name: 'Cart' }, // tên store trong DevTools
  ),
);

// Thêm món (dùng immer — push thẳng draft):
// useCart.setState((s) => { s.items.push({ id: 1, qty: 2 }); });
// Đổi số lượng không cần map: useCart.setState((s) => {
//   const it = s.items.find((i) => i.id === 1); // tìm trong draft
//   if (it) it.qty++; // "mutate" an toàn nhờ immer
// });
