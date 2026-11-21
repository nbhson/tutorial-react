# DAY 16: CUSTOM HOOKS (SERVICE)

## Mục tiêu bài học
- Hiểu custom hook là cách React đóng gói logic tái sử dụng — tương đương Service của Angular nhưng **không phải singleton, không có DI**, mà là hàm chia sẻ logic (mỗi lần gọi có state riêng).
- Viết được hook kinh điển: `useLocalStorage`, `useFetch`, `useDebounce`, `useOnlineStatus`; biết khi nào nên tách hook.
- Nắm quy tắc hook và phân biệt khi nào nên dùng hook vs store vs TanStack Query.

## Khái niệm cốt lõi (Core)

Mục này nói về cách React tái sử dụng logic: custom hook là hàm bọc state/effect — đọc để hiểu vì sao nó thay được Service của Angular, và ở đâu nó "không giống" Service.

### 1. Custom hook = function `use*` gọi hook khác bên trong
Không thần bí: hàm thường, nhưng tên `use*` để React/lint biết nó được phép gọi hook. Bên trong gọi `useState`/`useEffect`/hook khác — composition của hooks. Ví von: hook là "công thức nấu" chứ không phải "đĩa ăn dở" — mọi nhà dùng cùng một công thức, nhưng nồi canh ở mỗi nhà mỗi kiểu.

> 📄 **Code ví dụ:** [`examples/01-1-custom-hook-function-use-goi-hook-khac.tsx`](examples/01-1-custom-hook-function-use-goi-hook-khac.tsx)

Vì sao tiền tố `use` bắt buộc? Vì React phân biệt state theo **thứ tự gọi hook** (lần gọi 1, 2, 3...), lint kiểm tra rules chỉ cho hàm `use*`/component. Đặt `getStorage()` gọi `useState` bên trong là lint không kiểm, dễ gọi trong `if` → số hook đổi → "Rendered more hooks...".

> **Tóm gọn 1 câu:** Custom hook chỉ là hàm tên `use*` gom state/effect lại để dùng lại — công thức chung, mỗi nơi gọi một nồi riêng.

### 2. Ba quy tắc hooks (bắt buộc, không thương lượng)
1. Chỉ gọi **top-level** component/hook — không trong `if`/vòng lặp/hàm con/callback. Vì sao? Vì React nhớ state theo thứ tự gọi; điều kiện làm số lượng đổi giữa render → state gán sai ô.
2. Tên bắt đầu `use` (`useLocalStorage`, `useDebounce`). Vì sao? Để lint + người đọc biết đây là hook (có state/effect), không phải hàm thuần.
3. Chỉ gọi trong component function hoặc hook khác — không trong hàm thường/class. Vì sao? Vì ngoài render không có "phiên render" để gắn state.

> 📄 **Code ví dụ:** [`examples/02-2-ba-quy-tac-hooks-bat-buoc-khong.tsx`](examples/02-2-ba-quy-tac-hooks-bat-buoc-khong.tsx)

Ví von: rules of hooks như quy tắc xếp chỗ ngồi có số — React ghi tên theo số ghế (thứ tự gọi), không theo mặt người (tên biến); ai đổi chỗ tùy hứng là kẻ khác ngồi nhầm ghế.

> **Tóm gọn 1 câu:** Ba quy tắc hook = gọi top-level, tên `use*`, chỉ gọi trong component/hook — vì React nhớ state theo thứ tự gọi chứ không theo tên.

### 3. Không phải singleton — khác Service quan trọng nhất
`@Injectable({providedIn: "root"})` là 1 instance dùng chung 50 nơi (đổi 1 nơi, 49 nơi thấy). `useLocalStorage("a")` ở 50 component là 50 state độc lập (đổi 1 nơi, 49 nơi không biết). Muốn chia sẻ → Context (DAY 7, config ít đổi) hoặc store (DAY 8, hay đổi) + hook mỏng đọc (`useCart()` đọc store — hook là API, store là nguồn).

> 📄 **Code ví dụ:** [`examples/03-3-khong-phai-singleton-khac-service-quan-trong.tsx`](examples/03-3-khong-phai-singleton-khac-service-quan-trong.tsx)

Vì sao nhầm này nguy hiểm? Vì tưởng "hook như service" rồi để giỏ hàng vào `useCartState()` hook — mỗi trang một giỏ khác nhau, checkout sai. Hook chia sẻ *logic*, không chia sẻ *dữ liệu*. Ví von: Service là một két sắt chung cả công ty mở khóa một lần; hook là bản in hướng dẫn mở két — ai cũng có bản hướng dẫn, nhưng két thì một cái, muốn thêm két phải xin (store/context).

> **Tóm gọn 1 câu:** Hook chia sẻ công thức, không chia sẻ nồi — muốn nhiều component cùng một state thật thì cần store/context, không phải thêm hook.

### 4. Khi nào tách hook — 3 tín hiệu
Logic dùng ≥2 nơi (debounce ở search + filter); component >150 dòng vì gom state/effect (tách `useWindowSize` ra); muốn test logic không cần UI (`renderHook` DAY 21 cho `useDebounce` với fake timer). Đừng tách sớm (1 nơi dùng mà tách là trừu tượng thừa). Ví von: tách hook như mua rơm cho bồ — hai gà ăn mới đáng mua, một con gà ăn cám sẵn thì khỏi làm phức tạp.

> **Tóm gọn 1 câu:** Tách hook khi logic được 2 nơi dùng trở lên hoặc component ngộp thở — 1 nơi dùng thì cứ để nguyên.

### 5. Prod 2026: `useFetch` tự viết để học, TanStack để làm
`useFetch` trong example có AbortController + error nhưng thiếu cache/retry/dedupe/stale (DAY 12). Prod server state dùng TanStack Query; hook tự viết chỉ cho use case nhỏ (localStorage, debounce, online, toggle) hoặc bọc lib (`useCart()` đọc store).

> **Tóm gọn 1 câu:** Tự viết hook fetch để hiểu cơ chế, prod thì giao server state cho TanStack Query — hook tay chỉ lo việc nhỏ cục bộ.

### Keyword chính
`useX` (tiền tố), rules of hooks (top-level), lazy initializer (`useState(() => ...)`), AbortController trong hook, `as const` tuple, object vs tuple trả về, reusable logic (chia sẻ logic không chia sẻ data), service singleton ↔ hook riêng bản.

> **Tóm gọn 1 câu:** Thuộc 8 từ này là đủ làm việc với custom hook: tiền tố `use`, quy tắc top-level, lazy init, và ranh giới "logic được chia sẻ, data thì không".

## Luồng hoạt động (Flow)
Mục này đi qua 4 hook kinh điển trong example, từng bước một — đọc để thấy mỗi hook "sống" ra sao từ mount tới unmount.
1. `App` render: gọi `useLocalStorage("name")` → bên trong `useState(() => localStorage.getItem("name") ?? "")`. Hàm init chỉ chạy mount (lazy) — đọc storage 1 lần, render sau bỏ qua. SSR không storage thì `catch` về `initial`.
2. Gọi `useFetch(url)` → bên trong `useState(null)` + `useState(error)` + `useEffect([url])` sau mount: AbortController, reset data/error, fetch, check `ok`, `setData`, catch bỏ AbortError, cleanup abort. Trong khi chờ `user = null` → "đang tải...".
3. Gọi `useDebounce(name, 300)` → `useState(name)` + effect hẹn `setTimeout` 300ms. Gõ "a" → effect cũ cleanup (`clearTimeout`) + hẹn mới. Ngừng đủ 300ms → `debouncedName` cập nhật (dùng để search API, không gọi mỗi phím).
4. Gọi `useOnlineStatus()` → `useState(navigator.onLine)` + effect đăng ký `online`/`offline` + cleanup gỡ. Mất mạng → `online` false → UI báo.
5. User gõ input → `setName` (save của hook) → `setValue` (re-render) + `localStorage.setItem` ngay (đồng bộ). `debouncedName` hẹn lại từ đầu.
6. Mỗi `App` re-render, 4 hook chạy lại (là hàm) nhưng `useState`/`useEffect` giữ state theo **thứ tự gọi** — lần gọi 1 luôn là localStorage, 2 là fetch... Đổi thứ tự (thêm `if` bao hook) là state gán sai ô — lý do top-level.
7. Hai component cùng gọi `useLocalStorage("name")`: mỗi bên state riêng — không chung trừ đồng bộ tay (`storage` event cross-tab) hoặc context/store. Hook là hàm, không phải singleton.
8. `useFetch` url đổi → effect cleanup (abort cũ) + fetch mới (không race cũ đè mới). Unmount → abort, không `setData` sau unmount.
9. `useDebounce` value/delay đổi → cleanup timeout cũ + hẹn mới; unmount → clear, không set sau unmount.

> **Tóm gọn 1 câu:** Mỗi hook là một "tuyến đường" nhỏ: mount gắn, deps đổi dọn cũ gắn mới, unmount dọn sạch — và thứ tự gọi không bao giờ đổi giữa các render.

## Ví dụ chi tiết
Mục này cho code hoàn chỉnh khớp `example.tsx` — copy chạy thử rồi quay lại phần giải thích.
Khớp 1-1 với `example.tsx` (4 hook: localStorage/fetch/debounce/online):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng của 4 hook — đọc khi bạn thắc mắc "vì sao bọc hàm, vì sao `as const`".
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
Mục này đối chiếu Service/DI của Angular với hook — đọc để định vị đúng "hook đứng ở đâu" trong trí nhớ cũ về Service.

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

> **Cách đọc bảng này:** mỗi dòng là một vai trò của Service bên Angular, cột giữa là mảnh React thay thế, cột Ghi chú nêu điểm khác biệt — hàng quan trọng nhất là dòng "Trục khác biệt lớn nhất" (singleton ↔ mỗi nơi một bản), đọc nó trước.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của custom hook — từ lỗi crash ngay đến lỗi âm thầm chia sẻ sai state.

### 1. Hook trong điều kiện/vòng lặp → số hook đổi
> 📄 **Code ví dụ:** [`examples/05-1-hook-trong-ieu-kien-vong-lap-so.tsx`](examples/05-1-hook-trong-ieu-kien-vong-lap-so.tsx)
> 📄 **Code ví dụ:** [`examples/06-1-hook-trong-ieu-kien-vong-lap-so.tsx`](examples/06-1-hook-trong-ieu-kien-vong-lap-so.tsx)

### 2. Tưởng hook chia sẻ state (như singleton) → mỗi nơi một bản
> 📄 **Code ví dụ:** [`examples/07-2-tuong-hook-chia-se-state-nhu-singleton.tsx`](examples/07-2-tuong-hook-chia-se-state-nhu-singleton.tsx)
> 📄 **Code ví dụ:** [`examples/08-2-tuong-hook-chia-se-state-nhu-singleton.tsx`](examples/08-2-tuong-hook-chia-se-state-nhu-singleton.tsx)

### 3. Quên cleanup trong hook có effect → rò
Mô tả: `useOnlineStatus` thiếu `removeEventListener` là mỗi mount thêm 2 listener (StrictMode double là 4). Fix: mọi setup trong hook return cleanup (như example gỡ cả `online` + `offline`).

### 4. Tên không `use*` → lint không kiểm, dễ vi phạm
> 📄 **Code ví dụ:** [`examples/09-4-ten-khong-use-lint-khong-kiem-de.tsx`](examples/09-4-ten-khong-use-lint-khong-kiem-de.tsx)
> 📄 **Code ví dụ:** [`examples/10-4-ten-khong-use-lint-khong-kiem-de.tsx`](examples/10-4-ten-khong-use-lint-khong-kiem-de.tsx)

### 5. Tự viết `useFetch` cho prod phức tạp → vỡ cache/race/retry
Mô tả: thêm cache/dedupe/polling/retry vào hook tay là phình + sai. Fix: server state → TanStack Query (DAY 12); hook tay chỉ local (storage/debounce/online/toggle).

### 6. Gọi hook từ hàm thường → crash
> 📄 **Code ví dụ:** [`examples/11-6-goi-hook-tu-ham-thuong-crash.tsx`](examples/11-6-goi-hook-tu-ham-thuong-crash.tsx)
> 📄 **Code ví dụ:** [`examples/12-6-goi-hook-tu-ham-thuong-crash.tsx`](examples/12-6-goi-hook-tu-ham-thuong-crash.tsx)

## Best practices / Mẹo
Mục này là "nghề viết hook đẹp": đặt tên, chọn kiểu trả về, chỗ đặt file — đọc để hook của bạn dễ dùng như hook chuẩn React.
- **Hook là API gọn cho component**: `useCart()` (hook đọc store DAY 8), `useAuth()` (hook đọc context DAY 7). Vì sao bọc? Để component không thấy store/context object, chỉ thấy domain API + dễ mock test.
- Trả **object** khi >2 (`{ data, error, refetch }`) — tên tự tài liệu; tuple chỉ cho 2 quen (`[value, setValue]`). Vì sao? Vì `[a, b, c, d]` không nhớ vị trí, `{...}` nhớ tên.
- Test hook bằng `renderHook` (DAY 21) + fake timer cho debounce — không cần UI. Vì sao? Vì logic hook độc lập UI; test UI cho component, test hook cho logic.
- Đặt chung `src/hooks/`, riêng cạnh feature. Vì sao? Để import nhất quán + không lẫn hook dùng 1 lần với hook dùng 10 nơi.
- Tách khi dùng ≥2 nơi, không tách sớm. Vì sao? Vì trừu tượng sớm (1 nơi mà hook + test + docs) tốn hơn copy 3 dòng.
- **Tên theo hành vi** (`useDebounce`, `useOnlineStatus`, `useToggle`) — đọc nơi gọi là hiểu, không mở file.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một hook nhỏ để viết và so sánh kiểu trả về.

1. `useDebounce<T>(value, delay)` + ô search chỉ gọi API khi ngừng 300ms (effect theo debounced, không theo text). Đếm request 2 bản (theo text vs debounced) — giảm bao nhiêu?
2. `useLocalStorage` generic JSON (`useLocalStorage<{dark:boolean}>("theme")`) + `storage` event cross-tab (tab A đổi, tab B tự cập nhật qua listener + cleanup).
3. `useToggle(initial)` trả `[value, toggle, setTrue, setFalse]` cho modal — so sánh object vs tuple khi 4 giá trị (khi nào object rõ hơn?).
4. `useFetchWithState` trả `{ data, loading, error, refetch }` (refetch bằng counter state trigger effect) — so sánh dễ dùng với tuple.
5. `renderHook` test `useDebounce` (DAY 21): fake timer, assert trước delay giữ cũ, sau delay mới. Vì sao fake timer mà không chờ thật 300ms?

> **Tóm gọn 1 câu:** Custom hook là "Service không singleton": chia sẻ logic được, muốn chia sẻ state thật thì hook mỏng đọc store/context.

## Reference
- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
