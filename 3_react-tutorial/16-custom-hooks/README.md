# DAY 16: CUSTOM HOOKS (SERVICE)

## Mục tiêu bài học
- Hiểu custom hook là cách React đóng gói logic tái sử dụng — tương đương Service của Angular nhưng **không phải singleton, không có DI**, mà là hàm chia sẻ logic (mỗi lần gọi có state riêng).
- Viết được hook kinh điển: `useLocalStorage`, `useFetch`, `useDebounce`, `useOnlineStatus`; biết khi nào nên tách hook.
- Nắm quy tắc hook và phân biệt khi nào nên dùng hook vs store vs TanStack Query.

## Khái niệm cốt lõi (Core)

### 1. Custom hook = function `use*` gọi hook khác bên trong
Không thần bí: hàm thường, nhưng tên `use*` để React/lint biết nó được phép gọi hook. Bên trong gọi `useState`/`useEffect`/hook khác — composition của hooks.

```tsx
// useLocalStorage trong example.tsx: useState + logic storage gói trong hàm use*
function useLocalStorage(key: string, initial = "") {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  const save = (v: string) => { setValue(v); localStorage.setItem(key, v); };
  return [value, save] as const;
}
// Dùng như useState, thêm lưu trữ: const [name, setName] = useLocalStorage("name");
```

Vì sao tiền tố `use` bắt buộc? Vì React phân biệt state theo **thứ tự gọi hook** (lần gọi 1, 2, 3...), lint kiểm tra rules chỉ cho hàm `use*`/component. Đặt `getStorage()` gọi `useState` bên trong là lint không kiểm, dễ gọi trong `if` → số hook đổi → "Rendered more hooks...".

### 2. Ba quy tắc hooks (bắt buộc, không thương lượng)
1. Chỉ gọi **top-level** component/hook — không trong `if`/vòng lặp/hàm con/callback. Vì sao? Vì React nhớ state theo thứ tự gọi; điều kiện làm số lượng đổi giữa render → state gán sai ô.
2. Tên bắt đầu `use` (`useLocalStorage`, `useDebounce`). Vì sao? Để lint + người đọc biết đây là hook (có state/effect), không phải hàm thuần.
3. Chỉ gọi trong component function hoặc hook khác — không trong hàm thường/class. Vì sao? Vì ngoài render không có "phiên render" để gắn state.

```tsx
// ❌ SAI: hook trong điều kiện — user đổi là số hook đổi
if (user) { const [x] = useState(0); }

// ✅ ĐÚNG: hook top-level, điều kiện sau/bên trong
const [x] = useState(0);
if (!user) return null;
// Hoặc điều kiện BÊN TRONG hook: function useX(cond: boolean) { useEffect(..., [cond]); }
```

### 3. Không phải singleton — khác Service quan trọng nhất
`@Injectable({providedIn: "root"})` là 1 instance dùng chung 50 nơi (đổi 1 nơi, 49 nơi thấy). `useLocalStorage("a")` ở 50 component là 50 state độc lập (đổi 1 nơi, 49 nơi không biết). Muốn chia sẻ → Context (DAY 7, config ít đổi) hoặc store (DAY 8, hay đổi) + hook mỏng đọc (`useCart()` đọc store — hook là API, store là nguồn).

```tsx
// Hai component cùng key vẫn 2 bản — demo bản chất không singleton:
function A() { const [n] = useLocalStorage("name"); return <p>A: {n}</p>; }
function B() { const [n] = useLocalStorage("name"); return <p>B: {n}</p>; }
// Gõ ở A (setName) -> A re-render, B đứng yên (state riêng). Muốn chung: store/context + storage event.
```

Vì sao nhầm này nguy hiểm? Vì tưởng "hook như service" rồi để giỏ hàng vào `useCartState()` hook — mỗi trang một giỏ khác nhau, checkout sai. Hook chia sẻ *logic*, không chia sẻ *dữ liệu*.

### 4. Khi nào tách hook — 3 tín hiệu
Logic dùng ≥2 nơi (debounce ở search + filter); component >150 dòng vì gom state/effect (tách `useWindowSize` ra); muốn test logic không cần UI (`renderHook` DAY 21 cho `useDebounce` với fake timer). Đừng tách sớm (1 nơi dùng mà tách là trừu tượng thừa).

### 5. Prod 2026: `useFetch` tự viết để học, TanStack để làm
`useFetch` trong example có AbortController + error nhưng thiếu cache/retry/dedupe/stale (DAY 12). Prod server state dùng TanStack Query; hook tự viết chỉ cho use case nhỏ (localStorage, debounce, online, toggle) hoặc bọc lib (`useCart()` đọc store).

### Keyword chính
`useX` (tiền tố), rules of hooks (top-level), lazy initializer (`useState(() => ...)`), AbortController trong hook, `as const` tuple, object vs tuple trả về, reusable logic (chia sẻ logic không chia sẻ data), service singleton ↔ hook riêng bản.

## Luồng hoạt động (Flow)
1. `App` render: gọi `useLocalStorage("name")` → bên trong `useState(() => localStorage.getItem("name") ?? "")`. Hàm init chỉ chạy mount (lazy) — đọc storage 1 lần, render sau bỏ qua. SSR không storage thì `catch` về `initial`.
2. Gọi `useFetch(url)` → bên trong `useState(null)` + `useState(error)` + `useEffect([url])` sau mount: AbortController, reset data/error, fetch, check `ok`, `setData`, catch bỏ AbortError, cleanup abort. Trong khi chờ `user = null` → "đang tải...".
3. Gọi `useDebounce(name, 300)` → `useState(name)` + effect hẹn `setTimeout` 300ms. Gõ "a" → effect cũ cleanup (`clearTimeout`) + hẹn mới. Ngừng đủ 300ms → `debouncedName` cập nhật (dùng để search API, không gọi mỗi phím).
4. Gọi `useOnlineStatus()` → `useState(navigator.onLine)` + effect đăng ký `online`/`offline` + cleanup gỡ. Mất mạng → `online` false → UI báo.
5. User gõ input → `setName` (save của hook) → `setValue` (re-render) + `localStorage.setItem` ngay (đồng bộ). `debouncedName` hẹn lại từ đầu.
6. Mỗi `App` re-render, 4 hook chạy lại (là hàm) nhưng `useState`/`useEffect` giữ state theo **thứ tự gọi** — lần gọi 1 luôn là localStorage, 2 là fetch... Đổi thứ tự (thêm `if` bao hook) là state gán sai ô — lý do top-level.
7. Hai component cùng gọi `useLocalStorage("name")`: mỗi bên state riêng — không chung trừ đồng bộ tay (`storage` event cross-tab) hoặc context/store. Hook là hàm, không phải singleton.
8. `useFetch` url đổi → effect cleanup (abort cũ) + fetch mới (không race cũ đè mới). Unmount → abort, không `setData` sau unmount.
9. `useDebounce` value/delay đổi → cleanup timeout cũ + hẹn mới; unmount → clear, không set sau unmount.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (4 hook: localStorage/fetch/debounce/online):

```tsx
// example.tsx — DAY 16: useLocalStorage + useFetch + useDebounce + useOnlineStatus
// Mục đích: custom hook = hàm use* chia sẻ LOGIC (mỗi nơi state riêng) — khác Service singleton.
import { useEffect, useState } from "react"; // (1) Hook nền để hook custom gọi bên trong

// ── Hook 1: state đồng bộ localStorage (logic dùng ≥2 nơi thì tách) ──────────
function useLocalStorage(key: string, initial = "") {
  // (2) Lazy init: hàm chỉ chạy mount — đọc storage 1 lần, không mỗi render.
  // Vì sao hàm mà không giá trị? Vì localStorage.getItem mỗi render là phí + SSR crash (không có localStorage server).
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(key) ?? initial; } // ?? initial khi chưa có key
    catch { return initial; } // SSR/private-mode không storage vẫn chạy
  });
  // (3) save gói 2 việc (setState + storage) — component không biết chi tiết lưu. Đây là encapsulation kiểu Service.
  const save = (v: string) => {
    setValue(v); // re-render với giá trị mới
    try { localStorage.setItem(key, v); } catch { /* quota/private bỏ qua */ }
  };
  return [value, save] as const; // (4) as const -> tuple [string, (v:string)=>void], không phải mảng chung
}

// ── Hook 2: fetch có hủy (học; prod server state dùng TanStack DAY 12) ───────
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null); // null khi chờ — component hiện "đang tải..."
  const [error, setError] = useState<string | null>(null); // lỗi riêng để hiện, không nuốt
  useEffect(() => {
    const ctrl = new AbortController(); // hủy khi url đổi/unmount — tránh race (cũ về sau ghi đè mới)
    setData(null); setError(null); // reset khi url đổi
    fetch(url, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }) // check ok (DAY 12)
      .then((j: T) => setData(j))
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message)); });
    return () => ctrl.abort();
  }, [url]); // url đổi là fetch lại
  return { data, error }; // (5) Object khi >2 giá trị — tên trường tự tài liệu hơn tuple dài
}

// ── Hook 3: useDebounce — kinh điển search (chỉ gọi API khi ngừng gõ) ────────
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay); // hẹn cập nhật sau delay
    return () => clearTimeout(id); // gõ tiếp là hủy hẹn cũ — chỉ ngừng đủ lâu mới cập nhật
  }, [value, delay]);
  return debounced;
}

// ── Hook 4: useOnlineStatus — đồng bộ sự kiện trình duyệt ────────────────────
function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

export default function App() {
  // (6) Mỗi lần gọi là state RIÊNG — 2 useLocalStorage("name") ở 2 component là 2 bản (không singleton).
  const [name, setName] = useLocalStorage("name");
  const { data: user, error } = useFetch<{ name: string }>("https://jsonplaceholder.typicode.com/users/1");
  const debouncedName = useDebounce(name, 300); // gõ nhanh không gọi gì, ngừng 300ms mới có giá trị tìm
  const online = useOnlineStatus();
  return (
    <>
      <p>Online: {online ? "có mạng" : "mất mạng"}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên (lưu localStorage)" aria-label="Tên" />
      <p>Gõ (debounce 300ms): {debouncedName}</p>
      {/* (7) Ba nhánh data hook: lỗi -> chờ -> có */}
      {error ? <p role="alert">Lỗi API: {error}</p> : <p>API user: {user?.name ?? "đang tải..."}</p>}
    </>
  );
}
```

## Giải thích từng phần
- Dòng `useState(() => localStorage.getItem(key) ?? initial)`: lazy init — hàm chỉ mount. Vì sao? Vì `useState(localStorage.getItem(...))` (giá trị) đọc mỗi render (phí) + SSR crash (`localStorage` undefined server). Hàm thì render sau bỏ qua. `?? initial` khi key chưa có (getItem null).
- Khối `try/catch` quanh storage: SSR/private-mode/quota đầy ném. Vì sao catch? Để hook dùng được mọi môi trường (Next.js server, Safari private) — fallback `initial`, không trắng trang.
- Khối `save(v)`: gói `setValue` + `setItem` — component gọi 1 hàm, không biết storage. Đây là encapsulation như Service method. Không `useCallback` vì Compiler memo (chưa Compiler mà truyền save xuống `memo` con thì mới cần).
- Dòng `return [value, save] as const`: `as const` để TS suy tuple `[string, (v: string) => void]` — destructure đúng kiểu. Không có là `(string | function)[]` chung, `save("x")` báo "not callable".
- Khối `useFetch<T>`: generic tái dùng mọi shape (`useFetch<User>`, `useFetch<Product[]>`). `data: T | null` (null khi chờ) + `error` riêng (không nuốt). `setData(null)` khi url đổi để hiện "đang tải" thay vì data cũ (hoặc giữ cũ + `isFetching` nếu muốn như TanStack `keepPreviousData`).
- Dòng `if (!r.ok) throw` trong hook: fetch không reject HTTP lỗi — không check là 404 hiện như data. `catch` bỏ `AbortError` (hủy chủ đích khi url đổi/unmount/StrictMode), lỗi thật vào `error` để hiện `role="alert"`.
- Khối `useDebounce`: `setTimeout` + cleanup `clearTimeout` — gõ tiếp hủy hẹn cũ. Vì sao `delay` trong deps? Vì đổi delay phải hẹn lại theo mới. Dùng cho search: `const q = useDebounce(text, 300); useEffect(() => search(q), [q])` — chỉ search khi ngừng, không mỗi phím.
- Khối `useOnlineStatus`: `navigator.onLine` init (guard `typeof` cho SSR) + 2 listener + cleanup gỡ cả hai. Setup 2 gỡ 2 (đối xứng) — gỡ thiếu 1 là leak 1.
- Dòng `return { data, error }` (object) vs `[value, save]` (tuple): object khi >2/trường cần tên (`{ data, error, refetch }`), tuple khi đúng 2 quen thuộc (`[value, setValue]`). Vì sao? Vì tuple 4 phần tử (`[a, b, c, d]`) không ai nhớ vị trí; object tên tự tài liệu.
- Quy tắc **hook gọi hook được**: `useLocalStorage` dùng `useState`; có thể thêm `useEffect` đồng bộ cross-tab (`storage` event). Composition không giới hạn, chỉ cần top-level.
- Quy tắc **đặt hook**: dùng chung `src/hooks/`, chuyên biệt cạnh feature (`features/checkout/hooks/`). Vì sao? Để tìm nhanh + import nhất quán; hook gắn feature mà để chung là rối.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Injectable({providedIn: "root"})` singleton | custom hook `useX()` (mỗi nơi state riêng) | Chia sẻ logic, không chia sẻ data |
| `constructor(private svc: Svc)` inject | `const x = useX()` gọi | Gọi hàm thay vì DI container |
| Service giữ state chung + methods | hook logic + state cục bộ; chung → context/store + hook đọc | Trục khác biệt lớn nhất |
| Async data service (`getUsers()`) | `useFetch` (học) / `useQuery` TanStack (prod) | Prod không tự fetch-hook khi cần cache |
| Pipes/helpers thuần | hàm `utils/` + hook mỏng | Logic thuần ra utils, hook chỉ state/effect |
| `ngOnDestroy` dọn service | cleanup effect trong hook | Hook không lifecycle riêng, effect lo |
| `@Injectable` + `useFactory` (cấu hình) | hook nhận tham số (`useLocalStorage(key)`) | Cùng đóng gói logic + cấu hình qua đối số |
| Service `providedIn: "component"` (riêng instance) | state cục bộ trong hook mỗi component | Gần nhất với hook, nhưng Angular vẫn class |
| DI scope/token phức tạp | hook + context/store (DAY 7-8) | Không container, chỉ hàm + value |

## Lỗi thường gặp (Common pitfalls)

### 1. Hook trong điều kiện/vòng lặp → số hook đổi
```tsx
// ❌ SAI: user đổi là số hook đổi — "Rendered more hooks than during the previous render"
if (user) { const [x] = useState(0); }
for (const f of fields) { useEffect(...); }
```
```tsx
// ✅ ĐÚNG: top-level; điều kiện bên trong hook/effect
const [x] = useState(0);
if (!user) return null;
// Hook nhận cond: function useX(enabled: boolean) { useEffect(() => { if (enabled) {...} }, [enabled]); }
```

### 2. Tưởng hook chia sẻ state (như singleton) → mỗi nơi một bản
```tsx
// ❌ SAI: mong A set là B thấy (như service) — B đứng yên
function A() { const [n, setN] = useLocalStorage("n"); return <button onClick={() => setN("x")}>A</button>; }
function B() { const [n] = useLocalStorage("n"); return <p>B: {n}</p>; }
```
```tsx
// ✅ ĐÚNG: chung thì context/store; hook chỉ API đọc (xem DAY 7-8)
// const n = useCart((s) => s.name); // store singleton — A set B thấy
```

### 3. Quên cleanup trong hook có effect → rò
Mô tả: `useOnlineStatus` thiếu `removeEventListener` là mỗi mount thêm 2 listener (StrictMode double là 4). Fix: mọi setup trong hook return cleanup (như example gỡ cả `online` + `offline`).

### 4. Tên không `use*` → lint không kiểm, dễ vi phạm
```tsx
// ❌ SAI: getStorage gọi useState — ai đó gọi trong if mà lint không báo
function getStorage(key: string) { const [v] = useState(...); return v; }
```
```tsx
// ✅ ĐÚNG: useStorage — lint rules-of-hooks kiểm, người đọc biết có state
function useStorage(key: string) { const [v] = useState(...); return v; }
```

### 5. Tự viết `useFetch` cho prod phức tạp → vỡ cache/race/retry
Mô tả: thêm cache/dedupe/polling/retry vào hook tay là phình + sai. Fix: server state → TanStack Query (DAY 12); hook tay chỉ local (storage/debounce/online/toggle).

### 6. Gọi hook từ hàm thường → crash
```tsx
// ❌ SAI: helper thường gọi hook — không có phiên render để gắn
function formatName() { const [n] = useState(""); return n; }
```
```tsx
// ✅ ĐÚNG: chỉ trong component/hook (tên use* hoặc function Component PascalCase)
function useName() { const [n] = useState(""); return n; }
```

## Best practices / Mẹo
- **Hook là API gọn cho component**: `useCart()` (hook đọc store DAY 8), `useAuth()` (hook đọc context DAY 7). Vì sao bọc? Để component không thấy store/context object, chỉ thấy domain API + dễ mock test.
- Trả **object** khi >2 (`{ data, error, refetch }`) — tên tự tài liệu; tuple chỉ cho 2 quen (`[value, setValue]`). Vì sao? Vì `[a, b, c, d]` không nhớ vị trí, `{...}` nhớ tên.
- Test hook bằng `renderHook` (DAY 21) + fake timer cho debounce — không cần UI. Vì sao? Vì logic hook độc lập UI; test UI cho component, test hook cho logic.
- Đặt chung `src/hooks/`, riêng cạnh feature. Vì sao? Để import nhất quán + không lẫn hook dùng 1 lần với hook dùng 10 nơi.
- Tách khi dùng ≥2 nơi, không tách sớm. Vì sao? Vì trừu tượng sớm (1 nơi mà hook + test + docs) tốn hơn copy 3 dòng.
- **Tên theo hành vi** (`useDebounce`, `useOnlineStatus`, `useToggle`) — đọc nơi gọi là hiểu, không mở file.

## Bài tập nhỏ
1. `useDebounce<T>(value, delay)` + ô search chỉ gọi API khi ngừng 300ms (effect theo debounced, không theo text). Đếm request 2 bản (theo text vs debounced) — giảm bao nhiêu?
2. `useLocalStorage` generic JSON (`useLocalStorage<{dark:boolean}>("theme")`) + `storage` event cross-tab (tab A đổi, tab B tự cập nhật qua listener + cleanup).
3. `useToggle(initial)` trả `[value, toggle, setTrue, setFalse]` cho modal — so sánh object vs tuple khi 4 giá trị (khi nào object rõ hơn?).
4. `useFetchWithState` trả `{ data, loading, error, refetch }` (refetch bằng counter state trigger effect) — so sánh dễ dùng với tuple.
5. `renderHook` test `useDebounce` (DAY 21): fake timer, assert trước delay giữ cũ, sau delay mới. Vì sao fake timer mà không chờ thật 300ms?

## Reference
- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
