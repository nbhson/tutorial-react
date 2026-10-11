# Middleware + Persist — Giữ state, debug chuẩn

> Nguồn: https://zustand.docs.pmnd.rs/middlewares/persist — https://zustand.docs.pmnd.rs/middlewares/immer

## Mục tiêu
- Giữ state qua reload bằng `persist` (chọn field, version/migrate).
- Debug bằng `devtools` middleware; viết update lồng nhau gọn bằng `immer`.
- Hiểu thứ tự bọc middleware.

## Khái niệm cốt lõi
- **`persist(storeFn, { name, partialize, version, migrate })`**: tự ghi/đọc storage (mặc định localStorage). `name` là key; `partialize` chọn field giữ (bỏ function/loading nhất thời); `version` + `migrate` xử data cũ khi đổi shape.
- **Rehydrate bất đồng bộ**: lần render đầu state còn rỗng → UI cần chịu được (giỏ hiện 0 rồi nhảy số). Quan trọng thì `useStore.persist.hasHydrated()` để chờ.
- **`devtools`**: nối Redux DevTools — action có tên (`set` thứ ba nhận tên) để log đọc được.
- **`immer`**: viết `set((s) => { s.items.push(x) })` cho state lồng sâu — thay spread 3 tầng dễ sai.
- **Thứ tự bọc**: `create(devtools(persist(immer(fn))))` — lớp ngoài cùng chạy trước. Đặt `devtools` ngoài để log thấy state sau cùng.

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `partialize` trả subset — type ép về `CartState` vì persist merge lại khi rehydrate; field thiếu dùng initial.
- `version`/`migrate`: `(persisted, version) => newState` — không có là user cũ mở bản mới vỡ UI.
- Tên action trong DevTools: `set(..., false, "cart/add")` — tham số thứ ba đặt tên, log đọc được như Redux.
- `lastSync` bỏ ngoài persist vì là metadata phiên — giữ lại là số cũ gây hiểu nhầm "vừa đồng bộ".

## Lỗi thường gặp
- **Persist function/token nhạy cảm** → localStorage ai đọc cũng được (XSS). Fix: `partialize` loại ngay; token vào httpOnly cookie (nhóm `4_security-config`).
- **Persist `loading: true`** → reload xong kẹt spinner. Fix: chỉ persist dữ liệu, cờ nhất thời để initial.
- **Không chờ rehydrate** → UI nhảy số sau 1 frame, test flake. Fix: nhánh chờ `hasHydrated()` cho vùng quan trọng (giỏ/checkout).
- **Bọc sai thứ tự** (`persist(devtools(...))` vs ngược) → DevTools log thiếu bước. Fix: `devtools` ngoài cùng như mẫu.

## Reference
- [persist](https://zustand.docs.pmnd.rs/middlewares/persist) · [devtools](https://zustand.docs.pmnd.rs/middlewares/devtools) · [immer](https://zustand.docs.pmnd.rs/middlewares/immer)
