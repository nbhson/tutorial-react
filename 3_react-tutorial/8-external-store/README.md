# DAY 8: EXTERNAL STORE (DI NÂNG CAO)

## Mục tiêu bài học
- Hiểu external store là gì: state nằm **ngoài React** (module scope), React chỉ "subscribe" để đọc — tương đương Service + `BehaviorSubject` của Angular.
- Làm chủ 2 lựa chọn chuẩn 2026: **Zustand** cho app vừa (mặc định) và **Redux Toolkit** cho app lớn cần DevTools/time-travel; biết tự viết store với `useSyncExternalStore`.
- Nắm nguyên lý selector: subscribe đúng **slice** dữ liệu → giảm re-render so với Context.

## Khái niệm cốt lõi (Core)
- **External store = dữ liệu global, cập nhật nhiều nơi, đọc nhiều nơi.** Với Angular bạn quen `Service` + `BehaviorSubject` + `async` pipe. React không có service class — dùng store (object/function) tạo ngoài component.
- **`useSyncExternalStore(subscribe, getSnapshot)`:** hook nền tảng giúp React đọc an toàn store bên ngoài. Contract: `subscribe(fn)` đăng ký callback, `getSnapshot()` trả giá trị hiện tại. Zustand/Redux đều xây trên nguyên lý này.
- **Zustand — lựa chọn mặc định 2026:** `create<T>()((set) => ({...}))`, dùng `useCart(s => s.items.length)` để subscribe đúng slice. Không boilerplate, không Provider.
- **Redux Toolkit** cho app lớn: `createSlice`, `configureStore`, DevTools time-travel, `createAsyncThunk`/RTK Query. Tương đương NgRx nhưng gọn hơn.
- **Quyết định kiến trúc:** `useState` cho form/input cục bộ; Context cho config ít đổi (theme/auth); **store cho state hay đổi + nhiều subscriber** — tránh re-render cả cây vô tội vạ.
- **Keyword chính:** external store, `useSyncExternalStore`, Zustand, `create`, selector, `getSnapshot`, `subscribe`, Redux Toolkit, `createSlice`, `BehaviorSubject`.

## Luồng hoạt động (Flow)
1. Module load: file store chạy — Zustand `create` dựng store với state `items: []` và action `add`/`clear`; hoặc store tự viết có `listeners: Set` + `value: 0`.
2. Component `CartCount` render: gọi `useCart(s => s.items.length)` → Zustand subscribe selector; React re-render khi **giá trị slice** đổi.
3. User bấm "thêm hàng" → gọi action `add(item)` → `set(state => ({...}))` → Zustand thông báo cho các subscriber.
4. Chỉ những component đọc slice đổi (vd `s.items.length`) mới re-render; component đọc slice khác (`s.items`) hoặc không đọc thì đứng yên.
5. Với store tự viết: `inc()` sửa `value` rồi gọi `listeners.forEach(l => l())` → `useSyncExternalStore` thấy snapshot đổi → re-render component dùng `useCounterStore()`.
6. Zustand so sánh kết quả selector bằng `Object.is`; nếu slice không đổi (vd thêm item khác nhưng `items.length` giữ nguyên) → component đó **không** re-render.
7. Khi component unmount, Zustand/`useSyncExternalStore` tự gọi hàm unsubscribe — không còn callback trong `listeners`.
8. Đọc store ngoài React (`useCart.getState().add(...)`) cập nhật state như bình thường; subscriber (component) nhận thông báo ở batch kế tiếp.
9. React 18+ **batch** nhiều `set` trong cùng event → chỉ một vòng re-render; nhiều store cùng đổi trong 1 event cũng gộp.
10. Redux Toolkit: `dispatch(action)` → reducer tính state mới (bất biến nhờ Immer) → store thông báo → `useSelector` so slice → component liên quan re-render.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 8: external store tối giản (không cần lib)
import { useSyncExternalStore } from "react";

// Store nằm ngoài React — giống Service singleton + BehaviorSubject
const store = {
  value: 0,                        // nguồn dữ liệu thật
  listeners: new Set<() => void>(),// danh sách subscriber
  subscribe(fn: () => void) {      // contract của useSyncExternalStore
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); }; // unsubscribe khi unmount
  },
  getSnapshot() { return store.value; },          // trả giá trị hiện tại
  inc() { store.value++; store.listeners.forEach((l) => l()); }, // đổi state + báo
};

// Hook đọc store: đổi state ngoài -> UI cập nhật
function useCounterStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export default function App() {
  const count = useCounterStore(); // đọc snapshot mỗi lần store báo đổi
  return (
    <>
      <p>Count (external store): {count}</p>
      <button onClick={() => store.inc()}>+1</button>
    </>
  );
}
```

```tsx
// Zustand (prod): cùng module với trên, cài `npm i zustand`
import { create } from "zustand";

type CartState = { items: string[]; add: (item: string) => void; clear: () => void };
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  clear: () => set({ items: [] }),
}));

// Component chỉ subscribe đúng slice -> ít re-render:
function CartCount() {
  const count = useCart((s) => s.items.length); // slice: số lượng
  return <p>Giỏ hàng: {count}</p>;
}
```

Redux Toolkit (app lớn — DevTools time-travel):

```ts
import { configureStore, createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as string[] },
  reducers: { add: (s, a: { payload: string }) => { s.items.push(a.payload); } }, // Immer giúp bất biến
});
export const { add } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
```

## Giải thích từng phần
- `listeners: Set<() => void>`: bộ đếm subscriber — khi `getSnapshot` thay đổi, gọi hết callback để React biết cần kiểm tra lại.
- `subscribe` **phải trả về hàm hủy**: React gọi khi component unmount — không unsubscribe = rò rỉ bộ nhớ (giống phải `unsubscribe()` trong Angular).
- `getSnapshot` **phải trả cùng tham chiếu nếu giá trị không đổi** — nếu trả object mới mỗi lần, React tưởng "đổi" → render vô hạn (pitfall nổi tiếng). Zustand đảm bảo điều này cho bạn.
- `store.inc()` gọi ngoài React (từ event/effect/callback bất kỳ) — store không biết ai gọi, chỉ "báo hiệu" — đúng tinh thần external.
- Zustand `create<T>()((set) => ...)`: cú pháp curried bắt buộc cho TypeScript. Action luôn qua `set` → bất biến như state React.
- `useCart(s => s.items.length)`: selector chạy so sánh (mặc định `Object.is`) → nếu slice không đổi, component **không** re-render dù store đã đổi mảng.
- **Vì sao dùng `useSyncExternalStore` thay `useEffect` + `useState`?** — hook này xử lý đúng "tearing" (đọc store không nhất quán giữa các component trong 1 render) và concurrent rendering; đây là nền tảng của Zustand/Redux.
- **Middleware `persist`:** tự ghi/đọc state vào localStorage — hữu ích cho giỏ hàng, theme, nhưng cẩn thận dữ liệu nhạy cảm.
- **`useCart.getState()`/`setState()` ngoài React:** API Zustand cho phép đọc/ghi ở bất kỳ đâu — tiện nhưng dễ tạo "global ẩn" nếu lạm dụng.
- **Selector trả object mới:** `useCart(s => ({ a: s.a, b: s.b }))` khiến re-render mỗi lần; Zustand v5 khuyên trả nguyên thủy hoặc dùng `useShallow`.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| Service + `BehaviorSubject` | Zustand store / `useSyncExternalStore` | Cùng ý tưởng state global + subscribe |
| `async` pipe | selector `useCart(s => s.x)` | Pipe tự unsubscribe ↔ selector tự manage |
| `next(value)` | `set(state => ...)` / `store.inc()` | Update qua function chứ không phải stream |
| NgRx (Store + Actions + Reducers) | Redux Toolkit (`createSlice`, `configureStore`) | Cùng mô hình hành động/reducer |
| `@Injectable({providedIn: "root"})` | module-scope store (singleton tự nhiên) | Không cần provider/reference |
| Effects (nrgx/effects) | middleware (Zustand) / RTK Query | Fetch server phức tạp → dùng TanStack Query (DAY 12) |
| `Subject`/`BehaviorSubject` multicast | `Set<listener>` + notify | Cùng cơ chế pub/sub |
| `ChangeDetectionStrategy.OnPush` | selector slice + `useSyncExternalStore` | So slice thay vì cả store |
| `inject(Store)` typed | `useCart` typed + selector | Type suy từ store |

## Lỗi thường gặp (Common pitfalls)
- **`getSnapshot` trả object mới mỗi lần** → React báo "getSnapshot should be cached" / render loop. → Fix: cache object khi không đổi, hoặc dùng store có sẵn (Zustand lo việc này).
- **Quên trả unsubscribe trong `subscribe`** → leak listener khi component unmount. → Fix: `return () => delete fn`.
- **Subscribe cả store thay vì slice** — `useCart()` không selector → re-render mỗi thay đổi dù không liên quan. → Fix: luôn truyền selector; nhiều component → nhiều selector nhỏ.
- **Mutate object trong `set`** (`s.items.push(x)`) → tham chiếu không đổi → subscriber không thấy, UI "đơ". → Fix: luôn tạo mảng/object mới (`[...s.items, item]`).
- **Nhét toàn bộ app vào store** → mất lợi ích state cục bộ, debug khó. → Fix: giữ `useState` cho form/input; store chỉ cho state thật sự "toàn cục" và hay đổi.
- **Dùng store cho dữ liệu server** → phải tự lo cache/loading/retry. → Fix: dữ liệu server để TanStack Query (DAY 12); store chỉ cho client state (giỏ hàng, bộ lọc, theme).
- **Selector trả object/array mới mỗi lần** → re-render vô tận dù dữ liệu không đổi. → Fix: trả nguyên thủy, hoặc `useShallow`/`shallow` từ Zustand.
- **Dùng nhiều store rời rạc thay vì một + selector** → khó phối hợp, khó debug. → Fix: gom theo domain lớn, selector chia nhỏ.
- **Đọc store trong render rồi gán vào state** → tạo vòng lặp cập nhật. → Fix: đọc trực tiếp qua hook; chỉ dùng state cho giá trị cục bộ.

## Best practices / Mẹo
- **Chọn theo quy mô:** form/input → `useState`; config ít đổi → Context; cập nhật thường xuyên + nhiều nơi đọc → Zustand/Redux Toolkit. Với 2026, hầu hết app vừa chỉ cần Zustand.
- Tạo store **theo domain** (tách `useCart`, `useFilters`, `useAuth`) thay vì một `rootStore` duy nhất — quá trình migrate và tree-shaking dễ hơn.
- Zustand cho phép đọc store ngoài React (`useCart.getState().items`) — tiện trong event handler hoặc non-React code, nhưng hãy dùng có kỷ luật để tránh "hidden global".
- Batteries: thêm middleware `persist` (localStorage), `devtools` (Redux DevTools) khi store quan trọng.
- Nếu dùng Redux Toolkit, kết hợp **RTK Query** cho data fetching — nhưng bản thân nó cạnh tranh với TanStack Query; chọn 1.
- **Đặt tên action rõ nghĩa** (`addItem`, `removeItem`) — DevTools hiển thị log dễ đọc khi debug.
- Bật `devtools` middleware của Zustand khi phát triển; tắt ở prod nếu cần gọn.
- Tránh lưu state phái sinh (derived) trong store — tính bằng selector thay vì lưu trùng, tránh lệch dữ liệu.

## Bài tập nhỏ
1. Viết store tự viết (không lib) cho cart: `items`, `add`, `remove`, và 2 component: một đọc `items.length`, một đọc `items` — kiểm tra rằng bấm thêm hàng chỉ component cần thiết re-render (thêm `console.log` để chứng minh).
2. Cài Zustand, viết lại cart store bằng `create`, thêm middleware `persist` để giỏ hàng sống sót sau reload — so sánh code gọn hơn bản tự viết bao nhiêu.
3. Thêm selector `useCart(s => s.items)` và một component hiển thị item — xác nhận `add` làm cả 2 component re-render, còn thao tác khác chỉ làm một cái.
4. Viết action `remove(id)` bất biến (dùng `filter`) và kiểm tra UI + `persist` cập nhật đúng.
5. Đọc `useCart.getState().items` trong một event handler (không qua hook) rồi cập nhật UI — so sánh với cách đọc qua selector.

## Reference
- https://react.dev/reference/react/useSyncExternalStore
- https://zustand.docs.pmnd.rs/getting-started/introduction
- https://redux-toolkit.js.org/
- https://react.dev/learn/scaling-up-with-reducer-and-context