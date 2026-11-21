# DAY 8: EXTERNAL STORE (DI NÂNG CAO)

## Mục tiêu bài học
- Hiểu external store là gì: state nằm **ngoài React** (module scope), React chỉ "subscribe" để đọc — tương đương Service + `BehaviorSubject` của Angular.
- Làm chủ 2 lựa chọn chuẩn 2026: **Zustand** cho app vừa (mặc định) và **Redux Toolkit** cho app lớn cần DevTools/time-travel; biết tự viết store với `useSyncExternalStore`.
- Nắm nguyên lý selector: subscribe đúng **slice** dữ liệu → giảm re-render so với Context.

## Khái niệm cốt lõi (Core)

### 1. External store = state global ngoài React, nhiều nơi đọc/ghi
Với Angular bạn quen `Service` + `BehaviorSubject` + `async` pipe: service singleton giữ `currentValue`, `next()` đổi, component `subscribe`/`async` pipe đọc. React không có service class — dùng store là object/function tạo ở module scope (ngoài component, tồn tại suốt app), React "subscribe" để đọc qua `useSyncExternalStore` hoặc hook của lib.

> 📄 **Code ví dụ:** [`examples/01-1-external-store-state-global-ngoai-react-nhieu.ts`](examples/01-1-external-store-state-global-ngoai-react-nhieu.ts)

Vì sao ngoài React? Vì state này sống độc lập với cây component: chưa mount vẫn tồn tại, unmount hết vẫn còn, đọc/ghi được từ event/effect/non-React code (`cartStore.add()` từ nút, từ socket, từ setTimeout). `useState`/Context chết theo component; store sống theo module. Nếu nhét giỏ hàng vào `useState` ở App,Executors reload trang con là mất; store + `persist` middleware thì sống sót. Ví von: `useState` là tiền để trong túi áo (người chết theo là mất), store là tiền để trong két nhà (ai trong nhà cũng lấy được, khỏi theo ai).

> **Tóm gọn 1 câu:** External store là "két nhà chung" ngoài React: sống theo module, ai cần đọc/ghi đều được — component chỉ thuê mắt (selector) để soi đúng ngăn của mình.

### 2. `useSyncExternalStore(subscribe, getSnapshot)` — hợp đồng 2 hàm
Hook nền tảng giúp React đọc an toàn store ngoài. Contract bắt buộc: `subscribe(fn)` đăng ký callback và **trả hàm hủy**; `getSnapshot()` trả giá trị hiện tại. React gọi `subscribe` 1 lần sau mount, gọi `getSnapshot` mỗi lần cần so sánh, gọi hàm hủy khi unmount. Zustand/Redux đều xây trên nguyên lý này — hiểu nó là hiểu mọi store.

> 📄 **Code ví dụ:** [`examples/02-2-usesyncexternalstore-subscribe-getsnapshot-hop-ong-2-ham.ts`](examples/02-2-usesyncexternalstore-subscribe-getsnapshot-hop-ong-2-ham.ts)

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

> **Tóm gọn 1 câu:** `useSyncExternalStore` = hợp đồng 2 chữ ký: "có gì mới còi một tiếng" (subscribe) và "cho tôi xem hiện trạng" (getSnapshot) — mọi store lib đều đứng trên nó.

> **Cách đọc bảng này:** mỗi dòng là một thành viên trong store, trả lời hai câu hỏi "ai viết, ai gọi" — đọc để rạch ròi ranh giới: bạn quản dữ liệu và listener, React chỉ cầm `fn` và gọi đúng lúc.

### 3. Zustand — mặc định 2026 cho app vừa
`create<T>()((set) => ({...}))` (curried 2 ngoặc cho TypeScript), dùng `useCart(s => s.items.length)` subscribe đúng slice. Không boilerplate, không Provider, đọc ngoài React bằng `getState()`.

> 📄 **Code ví dụ:** [`examples/03-3-zustand-mac-inh-2026-cho-app-vua.tsx`](examples/03-3-zustand-mac-inh-2026-cho-app-vua.tsx)

Cơ chế selector: Zustand chạy selector lấy lát, so `Object.is` lát cũ/mới. Thêm item mà `items.length` giữ nguyên (không thể, nhưng ví dụ đổi tên item giữ length) thì `CartCount` **không** re-render. Đây là khác biệt với Context (value đổi là mọi consumer render). Selector trả object mới mỗi lần (`s => ({ a: s.a })`) thì so luôn khác → re-render vô tận — phải trả nguyên thủy hoặc `useShallow`.

> **Tóm gọn 1 câu:** Zustand = store tự viết cộng selector: mỗi component chỉ "soi đúng lát bánh" của mình — lát không đổi thì đứng yên.

### 4. Redux Toolkit cho app lớn cần audit/time-travel
`createSlice` (reducer + action một chỗ, Immer cho phép viết `push` mà vẫn bất biến), `configureStore`, DevTools time-travel/undo, `createAsyncThunk`/RTK Query cho fetch. Tương đương NgRx nhưng gọn hơn (không action file rời, không switch dài).

> 📄 **Code ví dụ:** [`examples/04-4-redux-toolkit-cho-app-lon-can-audit.ts`](examples/04-4-redux-toolkit-cho-app-lon-can-audit.ts)

Vì sao Immer quan trọng? Vì reducer đúng phải bất biến (trả object mới) để subscriber phát hiện đổi. Viết spread tay cho state lồng sâu dễ sót; Immer cho viết `push`/gán trực tiếp mà kết quả vẫn bất biến — giảm 80% bug mutate.

> **Tóm gọn 1 câu:** Redux Toolkit là "văn phòng lưu hồ sơ" cho app lớn: từng action một trang giấy, quay lại xem lại được (time-travel) — Immer là trợ lý viết hộ cho khỏi lỗi bất biến.

### 5. Quyết định kiến trúc 3 nấc
`useState` cho form/input cục bộ (chết theo component); Context cho config ít đổi xuyên tầng (theme/auth/locale — value đổi hiếm); **store cho state hay đổi + nhiều subscriber** (giỏ hàng, realtime, bộ lọc) — tránh re-render cả cây. Custom hook (`useLocalStorage`) không phải store — mỗi lần gọi là state riêng, không chia sẻ.

> **Tóm gọn 1 câu:** Ba nấc thang state: túi áo (`useState`), tủ nhà (`Context`), két sảnh chung (store) — hàng càng hay đổi càng để gần két.

### Keyword chính
external store, `useSyncExternalStore` (nền tảng), Zustand `create` + selector (mặc định), Redux Toolkit `createSlice` (app lớn), `getSnapshot`/`subscribe` (hợp đồng), `BehaviorSubject` ↔ store, selector slice.

## Bản đồ 2 trục (chọn cơ chế → chọn tool)

Trục 1 — đưa dữ liệu qua component (3 nấc theo quy mô):

| Cơ chế | Dùng khi | Giá phải trả |
|---|---|---|
| Props | Cha-con rõ ràng, 1–2 tầng | Truyền lòng vòng khi sâu (prop drilling) |
| Context | Config ít đổi, xuyên nhiều tầng (theme/auth/locale) | Value đổi là cả cụm consumer re-render |
| Store | State hay đổi + nhiều nơi đọc/ghi (giỏ hàng, realtime) | Thêm khái niệm + lib (hoặc tự viết như bài này) |

> **Cách đọc bảng này:** mỗi dòng là một nấc thang đưa dữ liệu, xếp từ rẻ đến đắt; đọc cột "Giá phải trả" để hiểu vì sao đừng nhảy nấc — chọn nấc thấp nhất còn chịu được cho việc của bạn.

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
Mục này đi qua 10 bước theo vòng đời thật của giỏ hàng: store sống trước component, đăng ký selector, bấm thêm hàng, so lát, unmount — đọc theo thứ tự để thấy "ai báo ai, ai render ai".
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

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

Redux Toolkit (app lớn — DevTools time-travel, audit từng action):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.ts`](examples/07-vi-du-chi-tiet.ts)

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
Mục này dịch từng khái niệm state global của Angular (Service + RxJS) sang thế giới store của React — đọc cột Ghi chú để thấy React "bỏ stream" nhưng giữ nguyên mô hình subscribe/so lát.
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

> **Cách đọc bảng này:** mỗi dòng là một cặp cũ ↔ mới; dòng 1 và dòng 4 là hai "trụ cột" (BehaviorSubject ↔ store, NgRx ↔ RTK) — các dòng còn lại là công cụ lân cận (pipe, effects, OnPush) đã được React giải quyết bằng cách khác.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 8 cái bẫy của external store — rễ chung là một: vi phạm hợp đồng "bất biến + tham chiếu ổn định" mà React dựa vào để so sánh.

### 1. `getSnapshot` trả object mới mỗi lần → render loop
> 📄 **Code ví dụ:** [`examples/08-1-getsnapshot-tra-object-moi-moi-lan-render.tsx`](examples/08-1-getsnapshot-tra-object-moi-moi-lan-render.tsx)
> 📄 **Code ví dụ:** [`examples/09-1-getsnapshot-tra-object-moi-moi-lan-render.tsx`](examples/09-1-getsnapshot-tra-object-moi-moi-lan-render.tsx)
Vì sao sai? Vì React so snapshot để quyết định render; snapshot mới mỗi lần là "đổi giả" → loop. Zustand lo điều này sẵn.

### 2. Quên trả unsubscribe trong `subscribe` → leak
> 📄 **Code ví dụ:** [`examples/10-2-quen-tra-unsubscribe-trong-subscribe-leak.tsx`](examples/10-2-quen-tra-unsubscribe-trong-subscribe-leak.tsx)
> 📄 **Code ví dụ:** [`examples/11-2-quen-tra-unsubscribe-trong-subscribe-leak.tsx`](examples/11-2-quen-tra-unsubscribe-trong-subscribe-leak.tsx)

### 3. Subscribe cả store thay vì slice → re-render thừa
> 📄 **Code ví dụ:** [`examples/12-3-subscribe-ca-store-thay-vi-slice-re.tsx`](examples/12-3-subscribe-ca-store-thay-vi-slice-re.tsx)
> 📄 **Code ví dụ:** [`examples/13-3-subscribe-ca-store-thay-vi-slice-re.tsx`](examples/13-3-subscribe-ca-store-thay-vi-slice-re.tsx)

### 4. Mutate trong `set` → UI đơ
> 📄 **Code ví dụ:** [`examples/14-4-mutate-trong-set-ui-o.tsx`](examples/14-4-mutate-trong-set-ui-o.tsx)
> 📄 **Code ví dụ:** [`examples/15-4-mutate-trong-set-ui-o.tsx`](examples/15-4-mutate-trong-set-ui-o.tsx)

### 5. Nhét toàn bộ app vào store
Mô tả: form input, toggle UI cục bộ cũng vào store → mất lợi ích state cục bộ, DevTools nhiễu, debug khó. Fix: `useState` cho form/input (chết theo component); store chỉ cho state thật sự global + hay đổi (cart, filter dùng chung, realtime).

### 6. Dùng store cho dữ liệu server → tự lo cache/loading/retry
> 📄 **Code ví dụ:** [`examples/16-6-dung-store-cho-du-lieu-server-tu.tsx`](examples/16-6-dung-store-cho-du-lieu-server-tu.tsx)
> 📄 **Code ví dụ:** [`examples/17-6-dung-store-cho-du-lieu-server-tu.tsx`](examples/17-6-dung-store-cho-du-lieu-server-tu.tsx)

### 7. Selector trả object/array mới mỗi lần → re-render vô tận
> 📄 **Code ví dụ:** [`examples/18-7-selector-tra-object-array-moi-moi-lan.tsx`](examples/18-7-selector-tra-object-array-moi-moi-lan.tsx)
> 📄 **Code ví dụ:** [`examples/19-7-selector-tra-object-array-moi-moi-lan.tsx`](examples/19-7-selector-tra-object-array-moi-moi-lan.tsx)

### 8. Đọc store trong render rồi gán vào state → loop
> 📄 **Code ví dụ:** [`examples/20-8-oc-store-trong-render-roi-gan-vao.tsx`](examples/20-8-oc-store-trong-render-roi-gan-vao.tsx)
> 📄 **Code ví dụ:** [`examples/21-8-oc-store-trong-render-roi-gan-vao.tsx`](examples/21-8-oc-store-trong-render-roi-gan-vao.tsx)

## Best practices / Mẹo
- **Chọn theo quy mô:** input/form → `useState`; config ít đổi → Context; hay đổi + nhiều nơi → Zustand (mặc định 2026)/Redux Toolkit (lớn cần DevTools). Vì sao? Vì mỗi cơ chế tối ưu cho một tần suất đổi khác nhau.
- Tạo store **theo domain** (`useCart`, `useFilters`, `useAuth`) thay vì một `rootStore` — migrate/tree-shaking dễ, selector nhỏ. Vì sao? Vì store khổng lồ thì selector nào cũng gần như cả store.
- Zustand đọc ngoài React (`getState()`/`setState()`) — tiện trong socket/handler/non-React, nhưng kỷ luật để tránh "hidden global" (ai cũng ghi từ đâu không biết). Vì sao kỷ luật? Vì global ẩn là nợ kỹ thuật khó trả nhất.
- Thêm middleware `persist` (localStorage) + `devtools` (Redux DevTools) khi store quan trọng. Vì sao? Vì persist giữ giỏ hàng qua reload, devtools cho time-travel khi debug.
- **Đặt tên action rõ** (`addItem`, `removeItem`) — DevTools log dễ đọc. Vì sao? Vì action `"set"` chung chung trong trace 100 dòng không biết ai gọi.
- Tránh lưu derived trong store — tính bằng selector (`total = items.reduce`) thay vì lưu `total` riêng. Vì sao? Vì hai nguồn (items + total) dễ lệch khi quên cập nhật một bên.

> **Tóm gọn 1 câu:** Store là két nhà chung: chia theo domain, đặt tên action rõ, luôn bất biến, selector trả lát ổn định — làm đúng thì chỉ người liên quan mới "rung" khi két mở.

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
