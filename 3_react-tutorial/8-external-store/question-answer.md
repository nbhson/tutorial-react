# DAY 8 — Hỏi & Đáp: External store

> File hỏi–đáp chi tiết cho `3_react-tutorial/8-external-store`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (store tự viết chạy được, không cần lib).

---

## 1. External store là gì? Khác `useState`/Context ở đâu?

**Hỏi:** State "nằm ngoài React" nghĩa là gì?

**Đáp:**
- External store = dữ liệu **sống ở module scope** (ngoài component), React chỉ **subscribe để đọc** —
  tương đương Service singleton + `BehaviorSubject` + `async` pipe của Angular.
- Khác `useState`: state không thuộc component nào, cập nhật từ bất kỳ đâu (kể cả ngoài React).
- Khác Context: có **selector** — component chỉ re-render khi slice nó đọc đổi, không phải cả cụm.
- Quy tắc chọn: `useState` cho cục bộ · Context cho config ít đổi · **store cho state hay đổi + nhiều subscriber**.

---

## 2. `useSyncExternalStore(subscribe, getSnapshot)` là gì?

**Hỏi:** Hai hàm truyền vào hook này làm gì? Vì sao example tự viết store được mà không cần lib?

**Đáp:**
- Đây là **hook nền tảng** mọi store lib (Zustand/Redux) đều xây trên nó. Contract chỉ 2 hàm:
  - `subscribe(fn)` — đăng ký callback, **trả hàm unsubscribe** (gọi khi unmount để gỡ khỏi `listeners`).
  - `getSnapshot()` — trả giá trị hiện tại để React so sánh có đổi không.
- Example tự viết đủ cả hai: `cartStore.subscribe` thêm/xóa trong `Set`, `cartStore.getSnapshot` trả `cartStore.items`,
  `cartStore.add()` tạo mảng mới rồi `listeners.forEach(l => l())` báo subscriber.
- `useCartStore(selector)` bọc hook nền tảng thêm lớp lọc — đúng mô hình "custom hook là Service" (DAY 16).

```ts
function useCartStore<T>(selector: (items: CartItem[]) => T): T {
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getSnapshot()));
}
```

---

## 3. Zustand khác store tự viết ở điểm nào?

**Hỏi:** Hiểu nguyên lý rồi, vì sao prod vẫn dùng Zustand?

**Đáp:**
- Zustand = store tự viết **hoàn thiện**: `create<T>()((set) => ({...}))`, không Provider, không boilerplate.
- Điểm ăn tiền là **selector**: `useCart((s) => s.items.length)` — component chỉ re-render khi slice đó đổi
  (so bằng `Object.is`). Example bài này đã demo đúng cơ chế đó bằng `useCartStore((s) => s.length)`.
- Thêm: đọc ngoài React (`useCart.getState().add(...)`), middleware (persist, devtools), batch nhiều `set`
  trong cùng event thành một vòng re-render.

---

## 4. Redux Toolkit khi nào thắng Zustand?

**Hỏi:** Hai lib này chọn thế nào?

**Đáp:**
- **Zustand** — mặc định 2026 cho app vừa: gọn, không boilerplate, đủ selector + middleware.
- **Redux Toolkit** — app lớn cần DevTools **time-travel**, quy ước team chặt, async chuẩn hóa
  (`createAsyncThunk`/RTK Query). Tương đương NgRx nhưng gọn hơn nhiều.
- Cả hai cùng nguyên lý: `dispatch/set` → reducer tính state mới bất biến → thông báo → selector so slice →
  component liên quan re-render.

---

## 5. Custom hook và store khác nhau thế nào? (Bẫy singleton)

**Hỏi:** `useLocalStorage("a")` gọi ở 50 component thì 50 nơi chung một giá trị à?

**Đáp:**
- **Không.** Custom hook là hàm logic — mỗi lần gọi có **state riêng độc lập** (khác Angular Service singleton).
  50 component gọi = 50 state riêng, không tự đồng bộ (trừ khi đồng bộ thủ công qua storage event).
- Muốn **chia sẻ state** thật → Context (DAY 7) hoặc store (bài này). Đây là trục khác biệt quan trọng nhất
  giữa Service Angular và hook React — nhầm là thiết kế sai kiến trúc.

---

## 6. So nhanh Angular ↔ React cho state global?

**Hỏi:** Service + BehaviorSubject tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| Service singleton + `BehaviorSubject` | external store + `useSyncExternalStore` | Cùng mô hình subscribe/snapshot |
| `async` pipe | hook đọc store (`useCartStore`) | Component không tự subscribe tay |
| NgRx | Redux Toolkit | RTK gọn hơn, có Immer + time-travel |
| Service đơn giản | Zustand | Mặc định cho app vừa |

## 7. `subscribe(fn)` — `fn` thực sự là gì? Khi nào `subscribe` được gọi?

**Hỏi:** `cartStore.listeners.add(fn)` — `fn` này là gì, ai tạo, ai gọi?

**Đáp:**
- `fn` **không phải component, không phải dữ liệu, không phải hàm bạn viết**. Nó là callback
  **do React tạo**, truyền vào qua tham số mỗi khi component gọi `useCartStore`.
- Chuỗi gọi chính xác:

```
CartCount render → useCartStore(selector) → useSyncExternalStore(subscribe, getSnapshot)
  → React (trong effect sau mount) gọi: cartStore.subscribe(fn_A)  // fn_A gắn với CartCount
    → cartStore.listeners.add(fn_A)                                // nằm trong Set
```

- `fn_A` tương đương `handleStoreChange` nội bộ của React: gọi nó thì React đọc lại `getSnapshot()`,
  khác cũ (`!==`) mới render lại component đó. Nên `fn: () => void` — không tham số, không trả gì,
  chỉ là tín hiệu "đi kiểm tra lại".
- `listeners` vì thế là `Set` các tham chiếu hàm — `size` luôn bằng số component đang sống và dùng hook
  (trong example là 2: `CartCount`, `CartList`). Hàm unsubscribe mà `subscribe` trả về được React gọi
  khi unmount để xóa `fn` khỏi `Set` (chống leak).
- Phân biệt **notify vs re-render**: `add()`/`clear()` gọi `forEach` là báo **tất cả** subscriber,
  nhưng mỗi component chỉ render lại khi lát nó đọc đổi (`Object.is`). Notify là "loa phường",
  re-render là quyết định riêng của từng component.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 8)
- https://react.dev/reference/react/useSyncExternalStore
- https://zustand.docs.pmnd.rs/ · https://redux-toolkit.js.org/
