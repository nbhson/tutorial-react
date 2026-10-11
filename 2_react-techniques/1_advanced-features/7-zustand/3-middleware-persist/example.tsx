import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Giỏ persist: devtools ngoài cùng để log đủ, immer trong cùng để viết gọn
type CartState = { items: { id: number; qty: number }[]; lastSync: number | null };
export const useCart = create<CartState>()(
  devtools( // DevTools thấy state cuối sau mọi middleware
    persist(
      immer((set) => ({ // mutate draft cho state lồng — khỏi spread 3 tầng
        items: [],
        lastSync: null, // metadata phiên — không persist (xem partialize)
      })),
      {
        name: 'cart', // key localStorage
        partialize: (s) => ({ items: s.items }) as CartState, // chỉ giữ items
        version: 1, // đổi shape thì tăng + thêm migrate
      },
    ),
    { name: 'Cart' }, // tên store trong DevTools
  ),
);

// Thêm món qua setState ngoài component — immer cho push thẳng draft:
// useCart.setState((s) => { s.items.push({ id: 1, qty: 2 }); });
// Đổi số lượng không cần map cả mảng:
// useCart.setState((s) => {
//   const it = s.items.find((i) => i.id === 1); // tìm trong draft
//   if (it) it.qty++; // "mutate" an toàn nhờ immer
// });
// Vùng quan trọng (checkout) chờ rehydrate xong: useCart.persist.hasHydrated()
