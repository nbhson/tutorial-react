# Zustand — Mini-track chi tiết

> Nguồn: https://zustand.docs.pmnd.rs/ · Đọc trước: [bài 3](../3-store-zustand-tanstack-query/README.md) (chia client/server state) và [DAY 8](../../../3_react-tutorial/8-external-store/README.md) (nguyên lý external store + selector).

## Mục tiêu track

- Hiểu Zustand từ lõi (store + subscribe + selector) đến prod (async, middleware, tổ chức slice).
- Cuối track viết được store đúng chuẩn: selector nhỏ, persist có chọn lọc, tách slice theo domain.
- Biết **ranh giới Zustand ↔ TanStack Query ↔ Context** — không lạm dụng store cho data không cần thiết.

## Bản đồ khái niệm

| # | Thư mục | Khái niệm | Khi nào dùng |
|---|---|---|---|
| 1 | [1-create-selectors/](1-create-selectors/README.md) | `create`, selector, `Object.is`, `useShallow`, đọc ngoài React | Mọi store — nền bắt buộc |
| 2 | [2-async-actions/](2-async-actions/README.md) | Action async, cờ loading/error, optimistic | Gọi API nhẹ trong store (nặng thì Query) |
| 3 | [3-middleware-persist/](3-middleware-persist/README.md) | `persist` + `partialize`/`migrate`, `devtools`, `immer` | Giữ state qua reload, debug |
| 4 | [4-slices-pattern/](4-slices-pattern/README.md) | Tách slice theo domain, gom store, chia file | Store phình >1 domain |

## Thứ tự đọc gợi ý

```
1 (selector) → 2 (async) → 3 (middleware) → 4 (tổ chức)
```

Lý do từng bước:

- **`1` là nền — sai selector là re-render thừa cả track.** Zustand mặc định so `Object.is` trên **kết quả selector**, nên selector trả object/array mới mỗi lần chạy (`(s) => ({ a: s.a, b: s.b })`) sẽ re-render mãi. Học `useShallow` + tách selector ngay từ đầu để không mang thói quen xấu sang bài sau.
- **`2` thêm async lên nền đó** — action async trong store cũng chỉ là hàm: `set` trước, `await` fetch, `set` sau. Khác Redux Toolkit: không cần `createAsyncThunk`/`extraReducers` — tự quản cờ loading/error trong state.
- **`3` bọc ngoài bằng middleware** — `persist` (lưu localStorage/AsyncStorage, `partialize` chọn field, `migrate` khi đổi shape), `devtools` (time-travel), `immer` (viết mutate trong set). Middleware xếp chồng theo thứ tự cụ thể — sai thứ tự là persist lưu trước immer áp dụng.
- **`4` refactor khi store lớn** — slice pattern tách theo domain rồi gom thành 1 store (hoặc nhiều store riêng). Đọc khi cần, không cần ngay — store < 200 dòng thì một file vẫn ổn.

## Khi nào dùng Zustand — khi nào không

**Chọn Zustand khi:**

- State client (UI): theme, sidebar mở/đóng, giỏ hàng, draft form, selection đa bước.
- Cần đọc state **ngoài component** (guard router, axios interceptor, worker) — `useStore.getState()`/`setState` dùng được ngoài React, Context không làm được điều này sạch sẽ.
- Muốn store không Provider, không boilerplate, bundle < 1.5KB.

**Không dùng Zustand khi:**

- Data từ **server** (fetch, cache, invalidation) — dùng TanStack Query/RTK Query. Zustand giữ *kết quả đã xử lý*, không phải cache server.
- State chỉ dùng trong 1 cây component — `useState`/`useReducer` + props là đủ; store toàn cục cho state cục bộ là đi ngược tính module.
- Cần cập nhật theo **thời gian thực tần suất cao** (mousemove, websocket 60fps) — cân nhắc store tách nhỏ + subscribe thủ công, hoặc để state nằm cục bộ.

**Vì sao Zustand không cần Provider?** Store là module-level singleton (`create()` gọi ngoài component), hook `useStore` subscribe trực tiếp qua `useSyncExternalStore` — không đi qua React Context. Đây cũng là lý do selector của nó không bị "mất re-render khi Context đổi" như Context API.

## Quy ước chung cả track

- Component luôn đọc qua **selector nhỏ** — không `useStore()` trần (trả cả store ⇒ re-render mọi thay đổi).
- Server data để Query lo (bài 3) — Zustand giữ client state + kết quả đã xử lý.
- Không lưu derived data — tính bằng selector, tránh lệch.
- Đặt tên action rõ nghĩa (`addItem`, không `setX`) — DevTools log đọc được.
- Selector là **hàm thuần, không tạo object mới mỗi lần** — nếu cần nhiều field, dùng `useShallow` hoặc chọn từng field riêng.
- Store đặt **ngoài component file** — `create()` chạy 1 lần ở module scope; đặt trong component là tạo store mới mỗi render.

## Trọng tâm cần nắm theo từng bài

### Bài 1 — create & selectors

`const useBearStore = create<State>()((set, get) => ({ ... }))` — `set` (partial merge), `get` (đọc hiện tại trong action). Đọc ngoài React: `useBearStore.getState()` / `.subscribe()` / `.setState()` — nền cho guard + interceptor. Selector so kết quả bằng `Object.is` → trả primitive hoặc dùng `useShallow`.

```ts
// store.ts — store ở module scope, KHÔNG đặt trong component
const useCartStore = create<CartState>()((set, get) => ({
  items: [] as Item[],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })), // immutable — KHÔNG push
  clear: () => set({ items: [] }),
}));

// Trong component — selector nhỏ, trả primitive
const count = useCartStore((s) => s.items.length); // chỉ re-render khi items đổi

// Nhiều field — useShallow tránh re-render thừa
const { items, coupon } = useCartStore(useShallow((s) => ({ items: s.items, coupon: s.coupon })));

// Ngoài React (axios interceptor, router guard):
if (useCartStore.getState().coupon) { /* đọc state không cần hook */ }
```

Sai lầm hay gặp ở bài này: `create()` đặt trong component (tạo store mới mỗi render) và selector trả object mới không có `useShallow` (re-render vô hạn).

### Bài 2 — async actions

Action async = hàm thường: `set({ loading: true })` → fetch → `set({ items, loading: false })` hoặc `set({ error })`. Optimistic update: `set` trước, fetch sau, lỗi thì rollback + `get()` đọc state trước đó. Race condition: throttle/abort ở tầng gọi (hoặc để Query lo).

```ts
applyCoupon: async (code) => {
  const prev = get().discount;       // rollback point
  set({ discount: code, checking: true }); // optimistic
  try {
    const res = await checkCoupon(code);
    if (!res.valid) set({ discount: prev, couponError: res.reason });
  } catch {
    set({ discount: prev, couponError: "mạng lỗi" });
  } finally {
    set({ checking: false });
  }
},
```

### Bài 3 — middleware

`persist` với `partialize` (chỉ persist phần dữ liệu, không persist loading/error) + `version`/`migrate` khi đổi shape; `devtools` cho time-travel; `immer` cho update lồng sâu. Thứ tự gợi ý: `persist(...)` bọc ngoài, `immer` trong.

```ts
const useStore = create<State>()(
  persist(
    immer((set) => ({ /* ... */ })),
    {
      name: "cart",
      version: 2,                       // đổi shape => bump version
      migrate: (old, v) => (v === 2 ? { ...old, coupon: null } : old),
      partialize: (s) => ({ items: s.items }), // KHÔNG persist loading/error
    }
  )
);
```

### Bài 4 — slices pattern

Mỗi domain 1 file export "creator" `(set, get) => ({...})`, gom bằng spread trong `create(...)`. Chia theo **domain dữ liệu** (cart, auth), không theo kỹ thuật (actions/state tách file kiểu Redux cũ). Store lớn có thể tách nhiều store riêng thay vì gom một store khổng lồ.

```ts
// slices/cart.ts
export const createCartSlice: StateCreator<AppStore, [], [], CartSlice> = (set, get) => ({ /*...*/ });
// store.ts
export const useAppStore = create<AppStore>()<StateCreator<AppStore>[]>()((...a) => ({
  ...createCartSlice(...a),
  ...createAuthSlice(...a),
}));
```

## Lỗi lặp lại ở cả track

1. **`useStore()` trần** — trả cả store ⇒ component re-render khi *bất kỳ* field nào đổi; luôn chọn field qua selector.
2. **Selector tạo object/array mới mỗi lần chạy** — `Object.is` thất bại ⇒ re-render mãi; dùng `useShallow` hoặc tách selector từng field.
3. **Lưu server cache vào Zustand** — tự viết loading/error/refetch là viết lại TanStack Query tồi; server data để Query, store giữ client state.
4. **Persist nhầm dữ liệu thoáng qua** — persist cả loading/error/thời gian ⇒ reload vào thấy app "kẹt" trạng thái cũ; `partialize` chỉ chọn field bền.
5. **Tạo store trong component** — `create()` phải gọi ở module scope 1 lần.

## Self-check trước khi coi là "xong track"

## So sánh nhanh trong track (tự rút kết luận)

| Tình huống | Giải pháp trong track |
|---|---|
| Component đọc 2 field lẻ | 2 selector riêng, không gom object |
| List 10k item + filter đắt | `createSelector`-style memo (reselect) hoặc tính trước trong action |
| Giỏ hàng sống qua F5 | `persist` + `partialize` chỉ persist items |
| Request HTTP GET list | Cân nhắc TanStack Query thay vì store tự viết |
| Cần đọc store trong axios interceptor | `useStore.getState()` — không dùng hook ngoài component |

## Self-check trước khi coi là "xong track"

1. Viết store + selector + `useShallow` đúng, giải thích được vì sao không `useShallow` thì re-render thừa.
2. Viết action async với optimistic update + rollback khi lỗi.
3. Persist giỏ hàng qua reload mà **không** persist cờ loading — nói được `partialize` chọn gì bỏ gì.
4. Chỉ ra chỗ `useStore()` trần gây re-render thừa và sửa bằng selector nhỏ.
5. Giải thích tại sao Zustand không cần Provider mà Context cần.

## Bài tập tổng hợp track

Dựng app "Giỏ hàng": store `cart` (items + discount code), action async `applyCoupon` (gọi API, optimistic, rollback khi lỗi), persist `items` nhưng không persist cờ loading, slice `auth` riêng tách domain. Mọi component đọc qua selector nhỏ — mở React DevTools chứng minh thêm item chỉ re-render component giỏ hàng.

## Reference

- [Zustand](https://zustand.docs.pmnd.rs/) · [Persist](https://zustand.docs.pmnd.rs/middlewares/persist) · [useShallow](https://zustand.docs.pmnd.rs/hooks/use-shallow)
- So sánh lựa chọn: [Zustand vs Redux vs Query — chia client/server state](../3-store-zustand-tanstack-query/README.md)
