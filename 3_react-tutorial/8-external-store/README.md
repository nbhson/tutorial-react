# DAY 8: EXTERNAL STORE (DI NÂNG CAO)

## Mục tiêu bài học
- Hiểu external store là gì: state nằm **ngoài React** (module scope), React chỉ "subscribe" để đọc — tương đương Service + `BehaviorSubject` của Angular.
- Làm chủ 2 lựa chọn chuẩn 2026: **Zustand** cho app vừa (mặc định) và **Redux Toolkit** cho app lớn cần DevTools/time-travel; biết tự viết store với `useSyncExternalStore`.
- Nắm nguyên lý selector: subscribe đúng **slice** dữ liệu → giảm re-render so với Context.

## Khái niệm cốt lõi (Core)

### 1. External store = state global ngoài React, nhiều nơi đọc/ghi
Với Angular bạn quen `Service` + `BehaviorSubject` + `async` pipe: service singleton giữ `currentValue`, `next()` đổi, component `subscribe`/`async` pipe đọc. React không có service class — dùng store là object/function tạo ở module scope (ngoài component, tồn tại suốt app), React "subscribe" để đọc qua `useSyncExternalStore` hoặc hook của lib.

```ts
// Angular: Service + BehaviorSubject
// @Injectable({ providedIn: "root" })
// cart$ = new BehaviorSubject<CartItem[]>([]);
// add(item) { this.cart$.next([...this.cart$.value, item]); }
// Template: {{ (cart$ | async)?.length }}

// React: store ngoài component + subscribe (xem example.tsx đầy đủ dưới)
const cartStore = { items: [] as CartItem[], listeners: new Set<() => void>(), /* ... */ };
// Component: const count = useCartStore((s) => s.length);
```

Vì sao ngoài React? Vì state này sống độc lập với cây component: chưa mount vẫn tồn tại, unmount hết vẫn còn, đọc/ghi được từ event/effect/non-React code (`cartStore.add()` từ nút, từ socket, từ setTimeout). `useState`/Context chết theo component; store sống theo module. Nếu nhét giỏ hàng vào `useState` ở App,Executors reload trang con là mất; store + `persist` middleware thì sống sót.

### 2. `useSyncExternalStore(subscribe, getSnapshot)` — hợp đồng 2 hàm
Hook nền tảng giúp React đọc an toàn store ngoài. Contract bắt buộc: `subscribe(fn)` đăng ký callback và **trả hàm hủy**; `getSnapshot()` trả giá trị hiện tại. React gọi `subscribe` 1 lần sau mount, gọi `getSnapshot` mỗi lần cần so sánh, gọi hàm hủy khi unmount. Zustand/Redux đều xây trên nguyên lý này — hiểu nó là hiểu mọi store.

```ts
// Hợp đồng tối giản (trích example.tsx, xem bản đầy đủ ở Ví dụ chi tiết):
subscribe(fn: () => void) {
  cartStore.listeners.add(fn); // bạn CẤT fn do React tạo vào Set
  return () => { cartStore.listeners.delete(fn); }; // bạn TRẢ hàm hủy, React GỌI khi unmount
},
getSnapshot() { return cartStore.items; }, // bạn TRẢ giá trị hiện tại, React SO SÁNH
// add(): bạn tạo mảng mới + forEach báo subscriber kiểm tra lại
```

Ai viết ai gọi (rạch ròi để không nhầm):

| Thành viên | Ai viết? | Ai gọi? |
|---|---|---|
| `items` (dữ liệu thật) | Bạn | Bạn đọc/ghi; React đọc gián tiếp qua `getSnapshot` |
| `listeners: Set` | Bạn tạo, bạn `add`/`delete` | React **không bao giờ** đụng — chỉ đưa `fn` cho bạn cất |
| `subscribe(fn)` | Bạn viết thân | **React gọi** (1 lần sau mount) |
| `getSnapshot()` | Bạn viết | **React gọi** (mỗi lần cần so sánh) |
| `add()`/`clear()` | Bạn viết, bạn gọi từ nút/socket | React không biết 2 hàm này tồn tại |
| `fn` trong `Set` | **React tạo**, đưa qua tham số | Bạn gọi gián tiếp qua `forEach` để báo |
| Hàm unsubscribe | Bạn viết (return) | **React gọi** khi unmount |

Vì sao phải `getSnapshot` trả cùng tham chiếu khi không đổi? Vì React so `Object.is(snapshot cũ, snapshot mới)` — trả object mới mỗi lần (dù nội dung giống) là React tưởng "đổi" → render loop + cảnh báo "getSnapshot should be cached". Zustand đảm bảo điều này; tự viết phải giữ (`items` chỉ gán mảng mới khi thật sự đổi).

### 3. Zustand — mặc định 2026 cho app vừa
`create<T>()((set) => ({...}))` (curried 2 ngoặc cho TypeScript), dùng `useCart(s => s.items.length)` subscribe đúng slice. Không boilerplate, không Provider, đọc ngoài React bằng `getState()`.

```tsx
// Zustand prod (cài npm i zustand) — cùng ý với store tự viết nhưng gọn + tối ưu sẵn:
import { create } from "zustand";
type CartState = { items: string[]; add: (item: string) => void; clear: () => void };
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // bất biến qua set
  clear: () => set({ items: [] }),
}));
function CartCount() {
  const count = useCart((s) => s.items.length); // selector: chỉ slice này đổi mới render
  return <p>Giỏ hàng: {count}</p>;
}
```

Cơ chế selector: Zustand chạy selector lấy lát, so `Object.is` lát cũ/mới. Thêm item mà `items.length` giữ nguyên (không thể, nhưng ví dụ đổi tên item giữ length) thì `CartCount` **không** re-render. Đây là khác biệt với Context (value đổi là mọi consumer render). Selector trả object mới mỗi lần (`s => ({ a: s.a })`) thì so luôn khác → re-render vô tận — phải trả nguyên thủy hoặc `useShallow`.

### 4. Redux Toolkit cho app lớn cần audit/time-travel
`createSlice` (reducer + action một chỗ, Immer cho phép viết `push` mà vẫn bất biến), `configureStore`, DevTools time-travel/undo, `createAsyncThunk`/RTK Query cho fetch. Tương đương NgRx nhưng gọn hơn (không action file rời, không switch dài).

```ts
// Redux Toolkit (app lớn — DevTools time-travel, audit action):
import { configureStore, createSlice } from "@reduxjs/toolkit";
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as string[] },
  reducers: { add: (s, a: { payload: string }) => { s.items.push(a.payload); } }, // Immer: viết mutate, thực chất bất biến
});
export const { add } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
// Component: const count = useSelector((s: RootState) => s.cart.items.length);
```

Vì sao Immer quan trọng? Vì reducer đúng phải bất biến (trả object mới) để subscriber phát hiện đổi. Viết spread tay cho state lồng sâu dễ sót; Immer cho viết `push`/gán trực tiếp mà kết quả vẫn bất biến — giảm 80% bug mutate.

### 5. Quyết định kiến trúc 3 nấc
`useState` cho form/input cục bộ (chết theo component); Context cho config ít đổi xuyên tầng (theme/auth/locale — value đổi hiếm); **store cho state hay đổi + nhiều subscriber** (giỏ hàng, realtime, bộ lọc) — tránh re-render cả cây. Custom hook (`useLocalStorage`) không phải store — mỗi lần gọi là state riêng, không chia sẻ.

### Keyword chính
external store, `useSyncExternalStore` (nền tảng), Zustand `create` + selector (mặc định), Redux Toolkit `createSlice` (app lớn), `getSnapshot`/`subscribe` (hợp đồng), `BehaviorSubject` ↔ store, selector slice.

## Bản đồ 2 trục (chọn cơ chế → chọn tool)

Trục 1 — đưa dữ liệu qua component (3 nấc theo quy mô):

| Cơ chế | Dùng khi | Giá phải trả |
|---|---|---|
| Props | Cha-con rõ ràng, 1–2 tầng | Truyền lòng vòng khi sâu (prop drilling) |
| Context | Config ít đổi, xuyên nhiều tầng (theme/auth/locale) | Value đổi là cả cụm consumer re-render |
| Store | State hay đổi + nhiều nơi đọc/ghi (giỏ hàng, realtime) | Thêm khái niệm + lib (hoặc tự viết như bài này) |

Trục 2 — trong "store" (3 thứ, không ngang hàng):

```
useSyncExternalStore   <- nền tảng (hook React, hợp đồng subscribe/getSnapshot)
   |-- Zustand         <- lib gọn: create + selector, không Provider (mặc định 2026)
   `-- Redux Toolkit   <- lib đầy đủ: slice + DevTools time-travel (app lớn)
```

- `useSyncExternalStore` là gạch nền — Zustand và Redux đều đứng trên nó. Hiểu nền thì đọc lib nào cũng hiểu.
- Zustand vs Redux mới là cặp ngang hàng: app vừa → Zustand (gọn, đủ); app lớn cần audit/time-travel/undo, team quen NgRx → Redux (xem 2 mini-track bài 6, 7 trong `2_react-techniques`).
- Custom hook (`useLocalStorage`...) không thuộc 2 trục — mỗi lần gọi là state riêng, không chia sẻ giữa component.

## Luồng hoạt động (Flow)
1. Module load: file store chạy — Zustand `create` dựng store với `items: []` + action `add`/`clear`; hoặc store tự viết có `listeners: Set` + `items: []`. Store tồn tại trước mọi component.
2. `CartCount` render: gọi `useCart(s => s.items.length)` (Zustand) hoặc `useCartStore(s => s.length)` (tự viết) → đăng ký selector; React nhớ lát hiện tại.
3. User bấm "thêm hàng" → `add(item)` → `set(s => ({...}))` (Zustand) hoặc gán mảng mới + `listeners.forEach(l => l())` (tự viết) → thông báo subscriber.
4. Mỗi subscriber chạy selector lại, so `Object.is` lát cũ/mới. Chỉ ai lát đổi (vd `length` 2→3) mới re-render; ai đọc lát khác hoặc không đọc thì đứng yên. Đây là khác biệt với Context.
5. Với store tự viết: `add()` tạo mảng mới `[...items, {id, name}]` (bất biến để tham chiếu đổi), rồi `forEach` báo. `useSyncExternalStore` thấy snapshot đổi → re-render component dùng hook.
6. Zustand so kết quả selector bằng `Object.is`; nếu slice không đổi → component đó **không** re-render dù store đã đổi mảng. Đo bằng `console.log` trong từng component để thấy.
7. Component unmount → Zustand/`useSyncExternalStore` tự gọi unsubscribe — callback rời `listeners`. Không còn rò rỉ như quên `unsubscribe()` Angular.
8. Đọc ngoài React (`useCart.getState().add(...)` / `cartStore.add(...)`) cập nhật bình thường; subscriber nhận ở batch kế tiếp. Tiện trong socket/setTimeout/non-React code nhưng dễ thành "global ẩn" nếu lạm dụng.
9. React 18+ **batch** nhiều `set` cùng event → một vòng re-render; nhiều store cùng đổi 1 event cũng gộp — không sợ "set 3 lần render 3 lần".
10. Redux Toolkit: `dispatch(add("x"))` → reducer (Immer) tính state mới bất biến → store thông báo → `useSelector` so slice → component liên quan re-render. DevTools ghi từng action để time-travel.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục (KHÔNG sửa example DAY 8 — đã chuẩn, chỉ mirror vào README):

```tsx
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
```

```tsx
// Zustand (prod): cùng module với trên, cài `npm i zustand`
import { create } from "zustand";

type CartState = { items: string[]; add: (item: string) => void; clear: () => void };
export const useCart = create<CartState>()((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })), // bất biến: mảng mới
  clear: () => set({ items: [] }),
}));

// Component chỉ subscribe đúng slice -> ít re-render (so Object.is lát):
function CartCount() {
  const count = useCart((s) => s.items.length); // slice số lượng
  return <p>Giỏ hàng: {count}</p>;
}
// Đọc ngoài React: useCart.getState().add("Hàng A") — tiện nhưng kỷ luật để tránh global ẩn.
```

Redux Toolkit (app lớn — DevTools time-travel, audit từng action):

```ts
import { configureStore, createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as string[] },
  reducers: { add: (s, a: { payload: string }) => { s.items.push(a.payload); } }, // Immer: viết mutate, kết quả bất biến
});
export const { add } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
// Component: const items = useSelector((s: RootState) => s.cart.items);
// Dispatch: dispatch(add("Hàng A")) — DevTools ghi action để time-travel/undo.
```

## Giải thích từng phần
- Dòng `let nextId = 1`: id tăng dần ở module scope, không trong store snapshot. Vì sao ngoài? Vì id không hiển thị, không cần báo subscriber; để trong `items` thì mỗi lần tăng id dù không thêm hàng cũng làm snapshot đổi.
- Khối `cartStore = { items, listeners, subscribe, getSnapshot, add, clear }`: singleton module — import ở đâu cũng cùng object. Vì sao singleton tự nhiên mà không cần `providedIn: "root"`? Vì ES module cache — file chạy 1 lần, mọi import chia sẻ.
- Dòng `listeners: new Set<() => void>`: `Set` tự loại trùng, `forEach` báo hết. Vì sao `Set` mà không mảng? Vì unsubscribe `delete` O(1), không sợ trùng fn đăng ký 2 lần.
- Khối `subscribe(fn)`: bạn **cất** `fn` (do React tạo, đóng closure kiểm tra snapshot của component đó) vào Set, **trả** hàm xóa. React gọi `subscribe` sau mount 1 lần, gọi hàm trả về khi unmount. Quên trả hàm hủy là leak — Set phình mỗi lần mount/unmount (giống quên `unsubscribe()` Angular).
- Khối `getSnapshot() { return cartStore.items; }`: trả **tham chiếu mảng hiện tại**. Vì sao phải cùng tham chiếu khi không đổi? Vì React so `Object.is` — trả `[...items]` copy mới mỗi lần (dù nội dung giống) là luôn "khác" → render loop. Chỉ gán mảng mới trong `add`/`clear` (lúc thật sự đổi).
- Khối `add(name)`: **bất biến** `[...items, {id, name}]` — mảng mới, phần tử cũ giữ nguyên tham chiếu. Vì sao bất biến? Để `Object.is` phát hiện đổi (tham chiếu khác) và selector so đúng. Mutate `push` giữ tham chiếu cũ → subscriber tưởng không đổi → UI đơ.
- Dòng `listeners.forEach((l) => l())`: "báo hiệu" thô — không truyền dữ liệu, chỉ bảo "kiểm tra lại đi". Mỗi subscriber tự chạy selector + so. Vì sao không truyền items mới vào callback? Vì contract `subscribe` chỉ nhận `() => void` — dữ liệu đọc qua `getSnapshot`, không qua tham số.
- Dòng `useCartStore<T>(selector)`: lớp lọc trên hook nền — `forEach` báo tất cả, nhưng mỗi subscriber chỉ render khi lát mình đổi. Đây đúng cách Zustand làm selector. Generic `<T>` để lát là number/mảng/object đều type-check.
- Dòng `useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getSnapshot()))`: chú ý `cartStore.subscribe` truyền **tham chiếu chưa bind** — vì `subscribe` dùng `cartStore.` trực tiếp (không `this`) nên không mất context. Nếu viết `subscribe() { this.listeners... }` thì phải `bind` hoặc arrow — đó là lý do example dùng `cartStore.` tường minh.
- Dòng `useCartStore((s) => s.length)` (CartCount): lát number — thêm hàng (2→3) thì render, `clear` (3→0) thì render, đổi tên hàng giữ length (nếu có action rename) thì **không** render. `CartList` đọc `(s) => s` (cả mảng) thì rename cũng render vì tham chiếu mảng đổi.
- Vì sao `useSyncExternalStore` thay `useEffect` + `useState` tự subscribe? Vì hook này xử lý "tearing" (2 component đọc store giữa 1 render thấy 2 giá trị khác nhau khi concurrent) + batch + StrictMode double-subscribe đúng. Tự viết effect dễ tearing khi React 18 concurrent.
- Middleware `persist` (Zustand): tự `localStorage` giỏ hàng/theme — sống sót reload. Cẩn thận dữ liệu nhạy cảm (token) — không persist token vào localStorage vì XSS đọc được.
- Selector trả object mới (`s => ({ a: s.a, b: s.b })`) thì `Object.is` luôn khác → re-render mỗi lần store đổi dù `a`/`b` giống. Fix: trả nguyên thủy riêng, hoặc `useShallow` (Zustand v5) so nông.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| Service + `BehaviorSubject<CartItem[]>` | Zustand store / `useSyncExternalStore` + `cartStore` | Cùng ý state global + subscribe/unsubscribe |
| `async` pipe (tự subscribe/unsubscribe) | selector `useCart(s => s.x)` (tự manage) | Pipe theo template ↔ selector theo hook |
| `next(value)` đẩy giá trị mới | `set(s => ...)` / `cartStore.add()` tạo state mới | Update qua function bất biến, không stream |
| NgRx (Store + Actions + Reducers + Effects) | Redux Toolkit (`createSlice`, `configureStore`, `createAsyncThunk`) | Cùng mô hình action/reducer, RTK gọn hơn |
| `@Injectable({providedIn: "root"})` singleton | module-scope store (ES module cache singleton tự nhiên) | Không cần provider/decorator |
| Effects (side effect async) | middleware Zustand / RTK Query / TanStack Query | Fetch server phức tạp → TanStack Query (DAY 12), không nhét vào cart store |
| `Subject` multicast | `Set<listener>` + `forEach` notify | Cùng pub/sub, React contract 2 hàm |
| `ChangeDetectionStrategy.OnPush` (so reference) | selector slice + `Object.is` | So lát thay vì cả store — cùng tinh thần |
| `inject(Store).select(...)` typed | `useCart` typed + selector generic | Type suy từ store, sai slice báo compile |
| `HttpTestingController` mock service | `useCart.setState()` / `getState()` trong test | Ghi đè state trực tiếp khi test, không cần TestBed |

## Lỗi thường gặp (Common pitfalls)

### 1. `getSnapshot` trả object mới mỗi lần → render loop
```tsx
// ❌ SAI: copy mới mỗi lần — Object.is luôn khác, React tưởng đổi liên tục
getSnapshot() { return [...cartStore.items]; } // cảnh báo "getSnapshot should be cached"
```
```tsx
// ✅ ĐÚNG: trả tham chiếu hiện tại; chỉ tạo mới khi thật sự đổi (trong add/clear)
getSnapshot() { return cartStore.items; }
```
Vì sao sai? Vì React so snapshot để quyết định render; snapshot mới mỗi lần là "đổi giả" → loop. Zustand lo điều này sẵn.

### 2. Quên trả unsubscribe trong `subscribe` → leak
```tsx
// ❌ SAI: không trả hàm hủy — Set phình mỗi mount/unmount
subscribe(fn: () => void) { cartStore.listeners.add(fn); }
```
```tsx
// ✅ ĐÚNG: trả hàm xóa, React gọi khi unmount (như example)
subscribe(fn: () => void) {
  cartStore.listeners.add(fn);
  return () => { cartStore.listeners.delete(fn); };
}
```

### 3. Subscribe cả store thay vì slice → re-render thừa
```tsx
// ❌ SAI: không selector — đổi field nào cũng render
const state = useCart(); // mọi set() đều render lại component này
```
```tsx
// ✅ ĐÚNG: selector nhỏ — chỉ lát đổi mới render
const count = useCart((s) => s.items.length);
const items = useCart((s) => s.items);
```

### 4. Mutate trong `set` → UI đơ
```tsx
// ❌ SAI: push giữ tham chiếu — subscriber tưởng không đổi
add: (item) => set((s) => { s.items.push(item); return s; })
```
```tsx
// ✅ ĐÚNG: mảng mới (Zustand thường) hoặc Immer (RTK cho phép push nhưng kết quả bất biến)
add: (item) => set((s) => ({ items: [...s.items, item] }))
// RTK: add: (s, a) => { s.items.push(a.payload); } // Immer biến thành bất biến giúp bạn
```

### 5. Nhét toàn bộ app vào store
Mô tả: form input, toggle UI cục bộ cũng vào store → mất lợi ích state cục bộ, DevTools nhiễu, debug khó. Fix: `useState` cho form/input (chết theo component); store chỉ cho state thật sự global + hay đổi (cart, filter dùng chung, realtime).

### 6. Dùng store cho dữ liệu server → tự lo cache/loading/retry
```tsx
// ❌ SAI: fetch users về set vào Zustand — phải tự viết loading/error/retry/dedupe/stale
const users = useStore((s) => s.users); useEffect(() => { fetch(...).then(set) }, []);
```
```tsx
// ✅ ĐÚNG: server state để TanStack Query (DAY 12); store chỉ client state
const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
```

### 7. Selector trả object/array mới mỗi lần → re-render vô tận
```tsx
// ❌ SAI: object literal mới mỗi lần — Object.is luôn khác
const { a, b } = useCart((s) => ({ a: s.a, b: s.b }));
```
```tsx
// ✅ ĐÚNG: selector nguyên thủy riêng, hoặc useShallow so nông (Zustand v5)
const a = useCart((s) => s.a); const b = useCart((s) => s.b);
import { useShallow } from "zustand/react/shallow";
const { a, b } = useCart(useShallow((s) => ({ a: s.a, b: s.b })));
```

### 8. Đọc store trong render rồi gán vào state → loop
```tsx
// ❌ SAI: render -> setState -> render ...
const items = useCartStore((s) => s);
const [copy, setCopy] = useState(items); setCopy(items); // loop
```
```tsx
// ✅ ĐÚNG: đọc trực tiếp qua hook; state chỉ cho giá trị cục bộ (filter text, input)
const items = useCartStore((s) => s); // dùng thẳng, không copy vào state
```

## Best practices / Mẹo
- **Chọn theo quy mô:** input/form → `useState`; config ít đổi → Context; hay đổi + nhiều nơi → Zustand (mặc định 2026)/Redux Toolkit (lớn cần DevTools). Vì sao? Vì mỗi cơ chế tối ưu cho một tần suất đổi khác nhau.
- Tạo store **theo domain** (`useCart`, `useFilters`, `useAuth`) thay vì một `rootStore` — migrate/tree-shaking dễ, selector nhỏ. Vì sao? Vì store khổng lồ thì selector nào cũng gần như cả store.
- Zustand đọc ngoài React (`getState()`/`setState()`) — tiện trong socket/handler/non-React, nhưng kỷ luật để tránh "hidden global" (ai cũng ghi từ đâu không biết). Vì sao kỷ luật? Vì global ẩn là nợ kỹ thuật khó trả nhất.
- Thêm middleware `persist` (localStorage) + `devtools` (Redux DevTools) khi store quan trọng. Vì sao? Vì persist giữ giỏ hàng qua reload, devtools cho time-travel khi debug.
- **Đặt tên action rõ** (`addItem`, `removeItem`) — DevTools log dễ đọc. Vì sao? Vì action `"set"` chung chung trong trace 100 dòng không biết ai gọi.
- Tránh lưu derived trong store — tính bằng selector (`total = items.reduce`) thay vì lưu `total` riêng. Vì sao? Vì hai nguồn (items + total) dễ lệch khi quên cập nhật một bên.

## Bài tập nhỏ
1. Viết store tự viết (không lib) cho cart: `items`, `add`, `remove`, và 2 component: một đọc `items.length`, một đọc `items` — thêm `console.log` chứng minh bấm thêm hàng thì cả hai render, còn action chỉ đổi tên (giữ length) thì chỉ list render.
2. Cài Zustand, viết lại cart bằng `create` + `persist` để giỏ sống sót reload — so sánh code gọn hơn bản tự viết bao nhiêu dòng, và `persist` lưu gì trong localStorage.
3. Thêm selector `useCart(s => s.items)` + component hiển thị item — xác nhận `add` làm cả 2 re-render, thao tác khác (đổi filter store khác) không làm cart render.
4. Viết action `remove(id)` bất biến (`filter`) và kiểm tra `persist` cập nhật đúng sau xóa + reload.
5. Đọc `useCart.getState().items` trong event handler (không qua hook) rồi cập nhật UI — so sánh khi nào đọc ngoài hook hợp lý (socket/timeout) và khi nào phải qua selector (render).

## Reference
- https://react.dev/reference/react/useSyncExternalStore
- https://zustand.docs.pmnd.rs/getting-started/introduction
- https://redux-toolkit.js.org/
- https://react.dev/learn/scaling-up-with-reducer-and-context
