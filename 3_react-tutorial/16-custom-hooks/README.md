# DAY 16: CUSTOM HOOKS (SERVICE)

## Mục tiêu bài học
- Hiểu custom hook là cách React đóng gói logic tái sử dụng — tương đương Service của Angular nhưng **không phải singleton, không có DI**, mà là hàm chia sẻ logic (mỗi lần gọi có state riêng).
- Viết được 2 hook kinh điển: `useLocalStorage` và `useFetch`; biết khi nào nên tách hook.
- Nắm quy tắc hook và phân biệt khi nào nên dùng hook vs store vs TanStack Query.

## Khái niệm cốt lõi (Core)
- **Custom hook = function tên `use*` gọi hook khác bên trong.** Không có gì thần bí: nó chỉ là hàm, nhưng tuân quy tắc để React biết nó được phép dùng hook.
- **3 quy tắc hooks (bắt buộc):**
  1. Chỉ gọi ở **top-level** component/hook — không gọi trong điều kiện, vòng lặp, hàm con.
  2. Tên bắt đầu bằng `use`.
  3. Chỉ gọi trong component function hoặc hook khác.
- **Không phải singleton (khác Angular Service):** gọi `useLocalStorage("a")` ở 50 component = 50 state độc lập. Muốn chia sẻ state → Context (DAY 7) hoặc store (DAY 8).
- **Đối chiếu Angular:** `@Injectable` Service là class singleton, logic + state dùng chung. React custom hook là hàm logic, **state ở component gọi nó**. Đây là trục khác biệt quan trọng nhất.
- **Khi nào tách hook:** logic dùng ở ≥2 nơi; component >150 dòng vì gom state/effect; muốn tách vấn đề cho dễ test.
- **Prod 2026:** `useFetch`/`useLocalStorage` tự viết thường chỉ dùng để học; `useFetch` trong prod nên thay bằng TanStack Query (DAY 12) nếu cần cache/retry/dedupe.
- **Keyword chính:** `useX`, rules of hooks, `useLocalStorage`, `useFetch`, lazy initializer, AbortController, reusable logic, service ↔ hook.

## Luồng hoạt động (Flow)
1. `App` render: gọi `useLocalStorage("name")` — bên trong chạy `useState(() => localStorage.getItem("name") ?? "")`. Hàm initializer chỉ chạy lần đầu (lazy) — đọc localStorage 1 lần.
2. Gọi `useFetch<{name}>(url)` — bên trong `useState(null)` + `useEffect([url])` chạy sau mount: tạo AbortController, fetch, resolve → setData; cleanup abort khi unmount/url đổi.
3. Trong khi chờ, `user` = null → hiện "đang tải...". Khi về, `user?.name` hiện.
4. User gõ input → `setName(e.target.value)` (hàm `save` của hook) → setState + localStorage.setItem ngay → state và storage đồng bộ.
5. Mỗi lần `App` re-render, hook chạy lại (là hàm) nhưng `useState`/`useEffect` giữ state theo **thứ tự gọi hook** — đây là lý do quy tắc top-level quan trọng.
6. Nếu 2 component cùng gọi `useLocalStorage("name")`: mỗi component một state riêng — không "chung" trừ khi bạn đồng bộ thủ công (storage event) hoặc dùng context/store.
7. Hook chạy lại **mỗi lần component render** (nó là hàm) — React phân biệt state của các lần gọi hook bằng **thứ tự gọi**, không bằng tên biến.
8. Vì thứ tự quan trọng, không được gọi hook có điều kiện — số lượng hook phải ổn định giữa các render.
9. `useDebounce(value, 300)`: mỗi lần `value` đổi, effect cũ cleanup `clearTimeout` rồi hẹn timeout mới; chỉ khi ngừng gõ 300ms mới cập nhật `debounced`.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 16: useLocalStorage + useFetch
import { useEffect, useState } from "react";

// Hook 1: state đồng bộ localStorage
function useLocalStorage(key: string, initial = "") {
  // Lazy initializer: chỉ đọc storage lần đầu render — tránh đọc mỗi render
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  const save = (v: string) => {
    setValue(v);                    // cập nhật state -> re-render
    localStorage.setItem(key, v);   // ghi storage — đồng bộ ngay
  };
  return [value, save] as const;    // "(value, save)" giống tuple AngularService
}

// Hook 2: fetch có hủy request
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then(setData);
    return () => ctrl.abort(); // hủy khi url đổi/unmount (xem DAY 12)
  }, [url]);
  return data;
}

export default function App() {
  const [name, setName] = useLocalStorage("name");
  const user = useFetch<{ name: string }>("https://jsonplaceholder.typicode.com/users/1");
  return (
    <>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên (lưu localStorage)" />
      <p>API user: {user?.name ?? "đang tải..."}</p>
    </>
  );
}
```

`useDebounce` — hook kinh điển của web app:

```tsx
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // cleanup: hủy timeout cũ khi value đổi
  }, [value, delay]);
  return debounced;
}
```

`useOnlineStatus` — đồng bộ với sự kiện trình duyệt:

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}
```

## Giải thích từng phần
- `useState(() => localStorage.getItem(key) ?? initial)`: truyền **hàm** làm initial = lazy initialization — chỉ chạy lần đầu, tiết kiệm đọc storage mỗi render.
- `save(v)`: gói 2 việc (setState + storage) vào một hàm — component không cần biết chi tiết lưu trữ. Đây chính là "encapsulation" của Service.
- `return [value, save] as const`: `as const` cho TS suy đúng tuple `[string, (v:string)=>void]` thay vì mảng chung — gỡ lỗi kiểu.
- `useFetch<T>`: generic để dùng lại với mọi shape. Fetch + AbortController giống DAY 12 nhưng đóng gói.
- `return () => ctrl.abort()`: bắt buộc — nếu không, url đổi nhanh sẽ setData sai (race condition).
- Lưu ý **hook không chứa global state**: hai `useLocalStorage` khác key = 2 storage khác; cùng key vẫn 2 state riêng (mỗi tab/component). Đó là bản chất "không singleton" của hook.
- **Hook không tự "memo" logic:** mọi tính toán trong hook chạy mỗi render; dùng `useMemo`/Compiler nếu thật sự nặng.
- **Hook gọi hook khác được:** `useLocalStorage` có thể dùng `useState` + `useEffect` — composition của hooks.
- **Trả về object vs tuple:** object khi nhiều trường (`{ data, loading, error }`), tuple khi đúng 2 (`[value, setValue]`).
- **Đặt hook gần nơi dùng hoặc trong `hooks/`** — nhất quán; hook chuyên biệt gắn với feature đặt cạnh feature.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Injectable({providedIn: "root"})` Service | custom hook `useX()` | service singleton ↔ hook có state riêng mỗi nơi |
| `constructor(private svc: Svc)` | `const x = useX()` | Gọi hook thay vì inject |
| Service giữ state chung + methods | hook logic + state cục bộ; state chung → context/store | Trục khác biệt |
| `async` data service | `useFetch` / `useQuery` | Prod ưu tiên TanStack Query |
| Pipes/helpers | hàm thuần trong `utils/` + hook mỏng | Tách logic |
| `ngOnDestroy` trong service | cleanup trong effect của hook | Hook không có lifecycle riêng |
| `@Injectable` + `useFactory` | custom hook nhận tham số | Cùng đóng gói logic + cấu hình |
| Service `providedIn: "component"` | state cục bộ trong hook | Không dùng chung giữa instance |
| DI scope phức tạp | hook + context/store (DAY 7-8) | Không có container DI riêng |

## Lỗi thường gặp (Common pitfalls)
- **Gọi hook trong điều kiện/vòng lặp** → "Rendered more hooks than during the previous render". → Fix: hook luôn ở top-level; điều kiện nằm *bên trong* hook.
- **Tưởng custom hook chia sẻ state giữa các component** (như Service singleton) → mỗi nơi một bản. → Fix: cần chung state dùng Context/store.
- **Quên cleanup trong hook có effect** → rò rỉ. → Fix: mọi setup trong hook trả cleanup.
- **Đặt tiền tố không phải `use`** → React không hiểu là hook, lint không kiểm tra, dễ vi phạm. → Fix: luôn `useXxx`.
- **Hook trả quá nhiều thứ / làm quá nhiều việc** → khó test/khó dùng. → Fix: một hook một mối quan tâm; hoặc trả object thay array khi >2 giá trị.
- **Tự viết `useFetch` rồi gặp race/retry/cache** → vỡ khi phức tạp. → Fix: TanStack Query cho server state; hook tự viết chỉ cho use case nhỏ.
- **Cố dùng hook như service singleton để chia sẻ state** → mỗi nơi một bản, gây nhầm lẫn. → Fix: hook đọc context/store khi cần chung.
- **Hook làm quá nhiều (fetch + form + storage)** → khó test. → Fix: chia nhỏ theo một mối quan tâm.
- **Gọi hook từ hàm thường** (`function helper() { useState() }`) → lỗi runtime. → Fix: chỉ gọi trong component/hook.

## Best practices / Mẹo
- **Hook là ranh giới tái sử dụng logic**; nếu logic dùng chung state, bọc hook + context/store: `useCart()` (hook đọc store). Vậy hook vẫn là "API" gọn cho component.
- Trả **object** khi hook có nhiều giá trị (`{ data, loading, error, refetch }`) thay vì tuple dài — tên trường tự tài liệu.
- Test hook độc lập bằng `renderHook` (DAY 21); nhờ vậy không cần render UI.
- Đặt hook dùng chung trong `src/hooks/`, hook chuyên biệt cạnh feature — nhất quán với cấu trúc dự án.
- Với React Compiler, logic trong hook vẫn được tối ưu; nhưng đừng dựa vào đó để bỏ cleanup/deps đúng.
- **Bắt đầu từ logic lặp lại**, tách thành hook khi dùng ≥2 nơi — đừng tách sớm gây trừu tượng thừa.
- **Hook trả API tối thiểu** đủ dùng; mở rộng sau khi có nhu cầu thật.
- **Đặt tên hook theo hành vi** (`useDebounce`, `useOnlineStatus`) để đọc code tự nhiên.

## Bài tập nhỏ
1. Viết `useDebounce<T>(value, delay)` dùng `useState` + `useEffect` + `setTimeout` cleanup — ứng dụng vào ô search input, chỉ gọi API khi ngừng gõ 300ms.
2. Nâng `useLocalStorage` thành `useLocalStorageState` nhận kiểu generic + parse/serialize JSON (`useLocalStorage<{dark:boolean}>("theme")`) và đồng bộ giữa các tab bằng `window.addEventListener("storage", ...)` + cleanup.
3. Viết `useToggle(initial)` trả `[value, toggle, setTrue, setFalse]` và dùng cho một modal.
4. Viết `useFetchWithState` trả `{ data, loading, error, refetch }` (object thay tuple) — so sánh độ dễ dùng.
5. Viết test `renderHook` cho `useDebounce` (DAY 21): giả lập timer và assert giá trị sau delay.

## Reference
- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state