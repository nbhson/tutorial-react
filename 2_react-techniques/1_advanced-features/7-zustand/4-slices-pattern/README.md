# Slices Pattern — Tổ chức store lớn

> Nguồn: https://zustand.docs.pmnd.rs/guides/slices-pattern

## Mục tiêu
- Tách store lớn thành slice theo domain (cart/ui/auth) mà vẫn là một store.
- Biết khi nào tách file, khi nào tách hẳn store riêng.

## Khái niệm cốt lõi
- **Slices pattern**: mỗi domain là hàm `(set, get) => sliceState`; store chính spread gộp: `create<State>()((...a) => ({ ...cartSlice(...a), ...uiSlice(...a) }))` — một store, nhiều file.
- **Một store vs nhiều store**: chung store thì action liên domain dễ (checkout đọc cart + auth), DevTools một chỗ. Tách store khi domain độc lập hẳn (vd editor canvas nặng tách khỏi app shell để tránh re-render chéo).
- **Type gộp**: `type State = CartSlice & UiSlice` — mỗi file export type slice của mình, store gộp bằng intersection.
- **Slice giao tiếp qua `get()`**: action cart đọc `get().user` thay vì import store user — tránh import vòng.
- **Đặt tên selector theo domain**: `useCart`, `useUi` là 2 hook cùng trỏ một store — component không biết (không cần biết) chúng chung gốc.

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `StateCreator<State, [], [], CartSlice>`: 4 generic (state gốc, middleware đã dùng, ..., slice trả về) — không middleware thì giữa để `[]`; có persist/devtools thì khai báo tuple tương ứng.
- `(...a)` truyền `set/get/api` xuống mọi slice — slice nào cũng đủ đồ nghề như store độc lập.
- Hook domain (`useCartItems`) là lớp đặt tên — người đọc code biết component thuộc domain nào, refactor tách store sau không vỡ component.
- Middleware (persist/devtools bài 3) bọc `create` ngoài cùng — slice không biết middleware tồn tại.

## Lỗi thường gặp
- **Một file store 500 dòng** → merge conflict, khó tìm. Fix: tách slice khi file > ~150 dòng hoặc có 2 domain rõ rệt.
- **Slice import nhau trực tiếp** (`cartSlice` import `uiSlice`) → import vòng. Fix: giao tiếp qua `get()` trong action.
- **Tách store quá sớm** (3 store cho app 3 màn hình) → đồng bộ liên store phức tạp hơn lợi ích. Fix: một store + slice trước, tách khi đo thấy re-render chéo thật.
- **Quên type middleware trong `StateCreator`** → lỗi type khó đọc khi thêm persist. Fix: khai báo tuple middleware đúng docs slices-pattern.

## Reference
- [Slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)
