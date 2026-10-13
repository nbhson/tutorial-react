# Q15: Nhiều chỗ cùng xài chung state, lúc đó em chọn Redux, Zustand hay cái gì? Vì sao?

## Câu hỏi

> Có một state chung mà nhiều component cùng đọc/ghi (ví dụ giỏ hàng) thì chọn Redux, Zustand, hay cách nào khác?
> Chúng khác nhau ra sao, và `useSyncExternalStore` (nền tảng của chúng) là gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- **External store = state nằm NGOÀI React** (module scope, sống suốt app, đọc/ghi được từ cả code không phải React). React "đăng ký đọc" nó qua **`useSyncExternalStore(subscribe, getSnapshot)`** — hook nền tảng (React 18) mà mọi thư viện store đều xây trên đó.
- Trong hệ React 2026, **3 lớp**, không phải "nhiều framework đối thủ":
  1. **`useSyncExternalStore`** — nền (gạch xây, hợp đồng 2 hàm `subscribe`/`getSnapshot`). Tự viết store = viết đúng hợp đồng này.
  2. **Zustand** — lib gọn: `create` + selector, không Provider → **mặc định cho app vừa** (2026).
  3. **Redux Toolkit (RTK)** — lib đầy đủ: slice + DevTools time-travel + audit action → **app lớn, team cần audit/undo**.
- **Mục đích của store (khác Context/props)**: state **đổi thường xuyên + nhiều nơi đọc/ghi** (giỏ hàng, realtime, bộ lọc) — và **selector cho phép mỗi component chỉ subscribe đúng "lát" (slice) mình đọc** → đổi slice A không kéo component đọc slice B (điểm Context làm không được — xem Q14).
- **Quy tắc 3 nấc chọn state**: `useState` (cục bộ, chết theo component) → **Context** (config ít đổi, xuyên tầng: theme/auth/locale) → **Store** (hay đổi + nhiều nơi) → server state riêng: **TanStack Query** (KHÔNG nhét vào store — cache/refetch/dedupe là việc của Query).

## Trả lời chi tiết

### 1. "Có bao nhiêu" — đáp án đúng theo trục kiến trúc

Không phải "5 thư viện giết nhau" — mà là **2 trục, 3 tầng** (mô hình trong [`8-external-store`](../../3_react-tutorial/8-external-store)):

**Trục 1 — "đưa dữ liệu qua component" (chọn theo quy mô):**

| Cơ chế | Dùng khi | Giá phải trả |
|---|---|---|
| **Props** | Cha-con rõ ràng, 1–2 tầng | Drilling khi sâu |
| **Context** | Config **ít đổi**, xuyên nhiều tầng (theme/auth/locale) | Value đổi = **mọi consumer** render (Q14) |
| **Store** | State **hay đổi + nhiều nơi đọc/ghi** (cart, realtime, filter) | Thêm khái niệm + lib (hoặc tự viết) |

**Trục 2 — "bên trong store" (không phải "nhiều lựa chọn ngang nhau"):**

```
useSyncExternalStore   ← nền tảng (hook React: hợp đồng subscribe/getSnapshot)
   ├─ Zustand          ← lib gọn (create + selector, không Provider) — MẶC ĐỊNH app vừa
   └─ Redux Toolkit    ← lib đầy đủ (slice + DevTools time-travel) — APP LỚN
```

- **Zustand và RTK "ngang hàng"** (cùng đứng trên `useSyncExternalStore`, chọn 1 trong 2).
- **TanStack Query KHÔNG thuộc trục store** — nó là **server state** (cache keyed theo query, refetch, dedupe, invalidation), chạy **song song** với client state (xem §4).

### 2. "Mục đích" của external store (nói được 4 ý = ăn điểm)

1. **Sống ngoài React**: module scope — chưa mount component vẫn tồn tại, unmount hết vẫn còn; đọc/ghi được từ socket, timer, code không React (Zustand `useStore.getState()` / RTK `store.dispatch` từ ngoài).
2. **Single source of truth (nguồn sự thật duy nhất)**: nhiều component + nhiều "writer" (UI, socket, timer) cùng đọc/ghi một dữ liệu mà không "lệch".
3. **Selector → re-render "mảnh"**: component đăng ký đúng slice mình đọc; store đổi nhưng slice mình đọc **không đổi** → **không re-render**. Đây là điểm Context làm không được (value đổi = "mọi" consumer render, Q14).
4. **Đối chiếu Angular**: chính là mô hình **`Service` + `BehaviorSubject` + `async` pipe** (Angular có sẵn framework; React phải chọn "lib" — vì React là "library" (Q1)).

### 3. `useSyncExternalStore(subscribe, getSnapshot)` — "hợp đồng nền tảng"

Hiểu nó = hiểu "mọi" store:

```ts
// Hợp đồng 2 hàm (trích store "tự viết" trong DAY 8):
subscribe(fn) {
  listeners.add(fn);            // React "gửi" callback, bạn "cất"
  return () => listeners.delete(fn); // BẠN "TRẢ" "hàm" "hủy", React "gọi" "khi unmount"
},
getSnapshot() { return items; } // React "gọi" "để so" (cũ vs mới)
```

- React gọi `subscribe` 1 lần sau mount; gọi `getSnapshot` mỗi lần cần so; gọi hàm hủy khi unmount.
- **Bẫy "ăn điểm"**: `getSnapshot` **phải trả cùng tham chiếu khi không đổi** (React so `Object.is` snapshot) — trả object mới mỗi lần (dù nội dung giống) → React "tưởng" "đổi" → **render loop** + cảnh báo "getSnapshot should be cached". Zustand/RTK đã lo việc này; tự viết thì phải giữ (chỉ gán mảng mới khi thật sự đổi).

### 4. Client state vs server state (nơi hay trả lời SAI nhất)

**Dùng "câu hỏi nhận diện"**: "Dữ liệu này có tồn tại trên server không (tắt app mở lại còn đúng)? Có cần cache theo key, refetch/invalidation?"

| Loại | Ví dụ | Cơ chế |
|---|---|---|
| **Server state** (từ API) | danh sách user, chi tiết sản phẩm, đơn hàng | **TanStack Query** (`useQuery`/`useMutation` — cache keyed, retry, dedupe, refetch when focused) |
| **Client state** (UI thuần) | sidebar đóng/mở, modal đang mở, filter "tạm", giỏ "nháp" | **Zustand** (hoặc RTK nếu app lớn) |
| **Form đang nhập** | input chưa submit | **`useState` / react-hook-form** — KHÔNG đưa vào store |

```tsx
// ✅ MỖI LOẠI STATE MỘT NƠI — KHÔNG copy server data vào Zustand
const sidebarOpen = useUiStore((s) => s.sidebarOpen);   // client (Zustand)
const { data: user } = useQuery({
  queryKey: ["users", id],
  queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()), // server (Query)
});

// ❌ SAI: fetch rồi "thả" user vào Zustand = 2 nguồn sự thật, tự viết lại cache/retry/dedupe
```

> **Khi nào chọn RTK Query** (thay TanStack Query): đã dùng Redux toàn app + muốn fetch hợp nhất vào store (tags, DevTools, undo) — nhưng **mặc định 2026 cho server state là TanStack Query** (lib riêng, chạy song song với bất kỳ client state nào: Zustand/RTK).

### 5. "Khi nào dùng gì" — bảng thực chiến (1 trang)

| Nhu cầu | Chọn | Lý do |
|---|---|---|
| 1 component (cục bộ, chết theo nó) | **`useState`** | Đơn giản nhất (Q9: lifting state khi cần chia sẻ) |
| Config ít đổi xuyên tầng (theme, locale, auth) | **Context** | "Giá rẻ" vì đổi hiếm (Q13) |
| Client state hay đổi + nhiều nơi (cart, filter, realtime) | **Zustand** (mặc định) | Gọn, không Provider, selector giới hạn re-render |
| App lớn + cần audit/time-travel/undo, team quen NgRx | **Redux Toolkit** | DevTools ghi mỗi action, undo, kỷ luật thay đổi (reducer thống nhất) |
| Server data (cache, refetch, dedupe, pagination) | **TanStack Query** | "Không tự viết" cache (khác store hoàn toàn) |
| Muốn học "nền" / cần control tối đa | store "thủ công" + `useSyncExternalStore` | Hiểu hợp đồng = đọc lib nào cũng hiểu |
| localStorage đơn giản | custom hook `useLocalStorage` | **KHÔNG** phải "store" (mỗi lần gọi = state riêng, không chia sẻ) |

### 6. Đối chiếu Angular (điểm "ăn điểm" cho người từ Angular)

| Angular | React 2026 | Ghi chú |
|---|---|---|
| `@Injectable Service` + `BehaviorSubject` | **Zustand / RTK** (store "ngoài" React) | Cùng mô hình "single source + subscribe" |
| NgRx (effect, reducer, store) | **Redux Toolkit** (+ RTK Query) | Team "quen NgRx" → RTK "gần" "tư duy" |
| HttpClient + interceptor | **TanStack Query** | "Server state" "chia riêng" |
| `OnPush` + change detection | Selector "mảnh" (Object.is) | "Cả hai" "tránh re-render thừa bằng so sánh" |

## Bẫy khi phỏng vấn

1. **"Zustand và Redux 'đối thủ', chọn 1"** (nói suông) → **khác nhau theo NGUY CẦU, không theo "ai tốt hơn"**: Zustand "mặc định app vừa" (gọn); RTK "app lớn" cần audit/time-travel. "Cả hai" "đều" "nằm trên" `useSyncExternalStore` — "nền" "cùng".
2. **"Nhét server data vào store"** (fetch + `setState` vào Zustand/RTK) → "tự viết" lại "cache/retry/dedupe" (dài, sai ở "biên" (mất mạng, unmount giữa fetch, 2 component fetch cùng 1 resource)). Fix: "TanStack Query" "cho server state, store" "chỉ" "client state".
3. **"Context 'đã đủ' — không cần store"** (nói suông) → sai "với dữ liệu đổi "thường xuyên": Context "value" "đổi là "mọi consumer render" (Q14); store + "selector" "giới hạn" "đúng slice" → "nhanh hơn".
4. **"Selector trả object mới"** (`s => ({a: s.a})`) mỗi lần → reference mới = "khác" = "re-render" "thừa" (thậm chí "vô tận" nếu không cẩn thận). Fix: "trả" "nguyên thủy" (một field) hoặc `useShallow` (Zustand).
5. **"Tự viết store mà `getSnapshot` trả object mới mỗi lần"** → React "tưởng" "đổi" (Object.is) → "render loop" + "cảnh báo" "getSnapshot should be cached". "Fix": "trả" "cùng tham chiếu khi không đổi (chỉ gán "mới" khi "đổi thật").

## Gợi ý câu chốt

> "Có 'một' nền `useSyncExternalStore` (hợp đồng subscribe/getSnapshot), 'một' cặp 'ngang hàng' 'trên đó: 'Zustand' (gọn — 'mặc định app vừa) và 'Redux Toolkit' (đầy đủ — app lớn cần DevTools/time-travel). 'Mục đích' 'cùng': single source of truth 'ngoài' React, selector 'để' 'mỗi' component 'chỉ' 're-render' 'khi' 'slice' 'mình đọc' 'đổi. 'Quy tắc' '3 nấc': 'useState' 'cục bộ → 'Context' 'config ít đổi xuyên tầng → 'Store' 'hay đổi nhiều nơi; và 'server state' 'giao 'riêng' 'cho TanStack Query' (không nhét vào 'store'). 'Điểm khác cơ bản với Angular: Angular 'có sẵn' DI + NgRx; 'React chỉ 'cung cấp' 'nền (useSyncExternalStore + concurrent), 'phần trên' 'là 'bạn 'tự' 'ghép (Q1)'"

## Reference

- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — "Nền tảng external store + hợp đồng useSyncExternalStore + Zustand vs RTK + '3 nấc' 'quyết định'"
- [`2_react-techniques/1_advanced-features/3-store-zustand-tanstack-query`](../../2_react-techniques/1_advanced-features/3-store-zustand-tanstack-query) — "Phân biệt client/server state (Query vs store) + 'bản đồ 2 trục'"
- [`2_react-techniques/1_advanced-features/7-zustand`](../../2_react-techniques/1_advanced-features/7-zustand) — Mini-track Zustand chi tiết (selector, "async, middleware, slices")
- [`2_react-techniques/1_advanced-features/6-redux-toolkit`](../../2_react-techniques/1_advanced-features/6-redux-toolkit) — Mini-track RTK (slice, thunk, entity, "RTK Query", devtools/persist)
- Q13 (Context vs Props) — "3 nấc" "props → Context → store" ("khi nào 'chuyển')"
- Q14 (Context "re-render") — "giá phải trả" "của Context" (mọi consumer "đổi) → "lý do" "cần store" (+ selector)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q13 — Context vs props?](../13-context-vs-props/README.md) · [Q14 — Context re-render lan?](../14-context-rerender/README.md)
- **Đào sâu (xuyên nhóm)**: [Q20 — server state thì không nhét vào Redux/Zustand (dùng TanStack Query)?](../20-data-fetching/README.md) · [Q27 — useSyncExternalStore (nền tảng của store)?](../27-which-effect-when/README.md)
