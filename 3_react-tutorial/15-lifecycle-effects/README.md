# DAY 15: LIFECYCLE & EFFECTS

## Mục tiêu bài học
- Nắm `useEffect` thay cho bộ `ngOnInit/ngOnChanges/ngOnDestroy` của Angular, và `useLayoutEffect` cho việc đo DOM trước khi trình duyệt vẽ.
- Khắc cốt quy tắc 2026: effect chỉ dành cho **đồng bộ với hệ thống ngoài** (timer, socket, DOM, subscription) — không dùng để tính toán dữ liệu từ props/state.
- Hiểu dùng `useEffectEvent` (React 19.2+) thay cho việc `eslint-disable` dependencies, và vì sao StrictMode chạy effect 2 lần ở dev.

## Khái niệm cốt lõi (Core)
- **Effect = side effect sau render.** Bản chất: `useEffect(fn, deps)` — React gọi `fn` **sau khi đã vẽ** (paint), khi `deps` thay đổi. Không có "lifecycle methods"; chỉ có effect chạy lại theo deps.
- **Deps quyết định vòng đời:** `[]` = chạy 1 lần sau mount (giống `ngOnInit`); `[x]` = chạy lại khi x đổi (giống `ngOnChanges` cho x); không truyền deps = chạy sau **mọi** render (thường sai).
- **Cleanup = `ngOnDestroy` + `ngOnChanges` "gỡ cũ":** `return () => {...}` chạy trước lần effect tiếp theo và khi unmount. Mọi setup phải có cleanup đối xứng.
- **Effect "đồng bộ", không phải "chạy 1 lần theo sự kiện".** Nếu ghép effect với "khi user click" hoặc "khi prop X đổi để gọi api" — thường sai mô hình; đó là việc của event handler/derived value.
- **`useLayoutEffect`:** chạy **trước** khi trình duyệt paint — dùng khi cần đo DOM rồi set state để tránh nháy (ví dụ tooltip position). `useEffect` chạy sau paint — mặc định dùng cái này.
- **StrictMode dev chạy effect 2 lần:** setup → cleanup → setup. Mục đích **phát hiện effect thiếu cleanup**. Prod chạy 1 lần. Đừng "trốn" bằng cách bỏ StrictMode — sửa effect.
- **`useEffectEvent` (React 19.2+):** tách "logic không reactive" (dùng giá trị mới nhất) khỏi deps — thay cho trick `eslint-disable react-hooks/exhaustive-deps` đầy rủi ro.
- **Keyword chính:** `useEffect`, deps, cleanup, `useLayoutEffect`, `useEffectEvent`, StrictMode, stale closure, external system.

## Luồng hoạt động (Flow)
1. Mount `App`: `useState(new Date())` khởi tạo đồng hồ; render đầu trả `<p>Đồng hồ: ...</p>`.
2. Sau paint (commit): effect #1 chạy — tạo `setInterval` mỗi 1s, lưu id, **trả cleanup**.
3. Effect #2 (title) chạy sau effect #1 vì deps `[userId, now]` — set `document.title`.
4. Mỗi giây: interval gọi `setNow(new Date())` → re-render → `now` mới → effect #2 deps `now` đổi → cleanup cũ chạy rồi effect mới set title mới.
5. Nếu `userId` prop đổi: effect #2 chạy lại (deps thay đổi) — effect #1 **không** chạy lại (deps `[]`).
6. Unmount: React chạy cleanup của effect #2 (nếu có) rồi effect #1 → `clearInterval`. Không còn timer rò rỉ.
7. Dev StrictMode: toàn bộ chuỗi mount chạy 2 lần (setup→cleanup→setup) để lộ bug; prod bỏ qua.
8. Nếu effect có deps `[roomId]` và `message` thay đổi liên tục, `useEffectEvent` cho handler đọc `message` mới nhất mà effect không chạy lại.
9. Khi deps là object/array tạo mới mỗi render, React so sánh theo tham chiếu → effect chạy lại vô ích; đó là lỗi phổ biến.
10. Cleanup chạy **trước** effect kế tiếp (khi deps đổi) và **một lần** khi unmount — setup/cleanup luôn đối xứng.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 15: clock + title theo userId
import { useEffect, useState } from "react";

export default function App({ userId = "1" }: { userId?: string }) {
  const [now, setNow] = useState(new Date());

  // Effect #1 — tương đương ngOnInit + ngOnDestroy
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    // cleanup: hàm trả về chạy khi unmount (và trước lần effect kế tiếp)
    return () => clearInterval(id);
  }, []); // deps rỗng = chỉ chạy 1 lần sau mount

  // Effect #2 — tương đương ngOnChanges cho [userId, now]
  useEffect(() => {
    document.title = `User ${userId} — ${now.toLocaleTimeString("vi-VN")}`;
  }, [userId, now]); // chạy lại mỗi khi userId hoặc now đổi

  return <p>Đồng hồ: {now.toLocaleTimeString("vi-VN")}</p>;
}
```

```tsx
// useEffectEvent: đọc giá trị mới nhất mà không thêm dependency (React 19.2+)
import { useEffect, useEffectEvent, useState } from "react";

function ChatRoom({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState("");
  // onConnected đọc `message` mới nhất nhưng KHÔNG cần nằm trong deps effect
  const onConnected = useEffectEvent(() => {
    console.log("Connected, message hiện tại:", message);
  });
  useEffect(() => {
    const conn = connect(roomId);
    conn.on("connected", onConnected);
    return () => conn.disconnect();
  }, [roomId]); // deps sạch: chỉ roomId
}
```

Derived value trong render thay vì effect (tránh anti-pattern):

```tsx
// ❌ Anti-pattern: effect để đồng bộ prop -> state
useEffect(() => setFullName(first + " " + last), [first, last]);

// ✅ Tính trực tiếp trong render — không cần effect, không thêm vòng render
const fullName = first + " " + last;
```

## Giải thích từng phần
- `useState(new Date())`: giá trị ban đầu; effect cập nhật mỗi giây.
- `useEffect(fn, [])`: chạy **1 lần** sau mount — đúng "khởi tạo hệ thống ngoài" (interval). Cleanup chạy khi unmount.
- `return () => clearInterval(id)`: bắt buộc — nếu không, timer tiếp tục chạy sau khi component biến mất (rò rỉ + setState trên unmounted).
- Effect #2 không có cleanup vì `document.title = ...` là idempotent — lần chạy sau ghi đè lần trước, không cần "gỡ".
- `[userId, now]`: đây là "reactive" — effect chạy lại khi deps đổi. Đừng đưa object/array tạo mỗi render vào deps (xem pitfalls).
- `useEffectEvent`: hàm callback tách khỏi reactive deps, đọc giá trị mới nhất (message) mà effect không cần liệt kê — giải quyết đúng vấn đề mà `eslint-disable` từng được dùng chữa cháy.
- **`useEffect` chạy sau paint; `useLayoutEffect` chạy trước paint:** dùng layout effect khi phải đo DOM rồi set state để tránh "nháy".
- **Derived value không cần effect:** tổng của list, filter data — tính trực tiếp trong render (hoặc `useMemo` nếu nặng).
- **`useEffectEvent` không nằm trong deps:** nó luôn đọc giá trị mới nhất, giải quyết stale closure mà không cần disable lint.
- **Nhiều effect tách biệt theo mục đích** — đừng gộp timer + fetch + title vào một effect khổng lồ.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ngOnInit` | `useEffect(fn, [])` | Chạy 1 lần sau mount (sau paint) |
| `ngOnChanges` | `useEffect(fn, [prop])` | Chạy lại khi prop đổi |
| `ngOnDestroy` | `return () => cleanup` | Trong cùng effect |
| `ngAfterViewInit` (đo DOM) | `useLayoutEffect` | Chạy trước paint, tránh nháy |
| `ngDoCheck` | Không có tương đương | Dùng derived value trong render |
| Subscription `.unsubscribe()` | cleanup trong effect | Không quên |
| `ChangeDetectorRef.detectChanges` | `setState` | React tự re-render khi state đổi |
| `zone.js` điều phối | React scheduler | Không cần zone |
| `ngAfterContentInit` | không có effect tương ứng | Content traversal trong render (DAY 9) |
| `NgZone.runOutsideAngular` | không cần | React không dùng zone |

## Lỗi thường gặp (Common pitfalls)
- **Thiếu deps (stale closure):** effect dùng state/props nhưng deps thiếu → effect giữ giá trị cũ. → Fix: khai đủ theo `eslint-plugin-react-hooks`; nếu vướng, dùng `useEffectEvent` thay vì disable.
- **Thừa deps: object/array/function tạo mỗi render** nằm trong deps → effect chạy lại mỗi render (vòng lặp). → Fix: tách giá trị nguyên thủy, `useMemo`/`useCallback` khi cần tham chiếu ổn định, hoặc Compiler.
- **Dùng effect để "chạy khi prop đổi rồi setState"** → thêm 1 vòng render và có thể lặp; đây là anti-pattern. → Fix: tính trực tiếp trong render (derived state); hoặc dùng `key` để reset component.
- **Quên cleanup (subscription, addEventListener, timer)** → rò rỉ bộ nhớ. → Fix: mọi setup phải return cleanup; StrictMode dev giúp phát hiện.
- **Bỏ StrictMode để hết "lỗi 2 lần"** → che bug thật. → Fix: viết cleanup đúng; 2 lần ở dev là miễn phí, prod 1 lần.
- **Đặt `document.title`/localStorage/fetch trong render** thay vì effect → tác động phụ mỗi render, SAI nguyên tắc. → Fix: render phải "thuần" (pure); side-effect để effect/event.
- **Gộp nhiều mục đích vào một effect** → chạy lại thừa, khó debug. → Fix: mỗi effect một mối quan tâm.
- **Dùng effect để đồng bộ state với prop** → thêm vòng render. → Fix: tính trong render hoặc dùng `key` để reset.
- **Cleanup không đối xứng setup** (tạo 2 listener, gỡ 1) → rò rỉ. → Fix: setup và cleanup cùng số lượng tài nguyên.

## Best practices / Mẹo
- **Câu hỏi gốc trước khi viết effect:** "Có hệ thống ngoài nào cần đồng bộ không?" Nếu không → đừng dùng effect, tính trong render.
- Với React Compiler 1.0, nhiều tối ưu tham chiếu không cần `useCallback` — nhưng **deps của effect vẫn phải đúng**; Compiler không chữa stale closure do logic sai.
- Dùng `useEffectEvent` (React 19.2+) khi effect consumer cần "giá trị mới nhất" (analytics, socket handler, theme hiện tại) mà không muốn thêm deps.
- Với đo DOM, dùng `useLayoutEffect`; cẩn thận SSR (nó không chạy server) — React 19 khuyến nghị theo dõi bằng `useSyncExternalStore` khi có thể.
- Data fetching: không dùng effect tự viết (DAY 12) — dùng TanStack Query; effect chỉ còn cho các hệ thống ngoài như timer/socket/DOM.
- **Giữ effect nhỏ và độc lập**, mỗi cái một tài nguyên (timer, socket, DOM) — dễ suy luận và dễ cleanup.
- **Ưu tiên sự kiện hơn effect** cho logic "khi user làm X" — effect là để đồng bộ, không phải để bắt sự kiện.
- **Kiểm thử với StrictMode bật** (dev) để lộ effect thiếu cleanup trước khi lên prod.

## Bài tập nhỏ
1. Viết `useWindowSize` dùng `useEffect` + `resize` listener + cleanup — kiểm tra StrictMode không lỗi và bỏ listener khi unmount (dùng `window.addEventListener`/`removeEventListener`).
2. Chuyển effect #2 của ví dụ sang dùng `useEffectEvent` để đọc `userId` mới nhất mà giữ deps `[]` — so sánh với bản thêm `userId` vào deps (cả hai đúng, chọn cách phù hợp).
3. Viết `useEventListener(target, type, handler)` bao `addEventListener` + cleanup; dùng cho `resize`.
4. Thay một effect "setState khi prop đổi" bằng derived value trong render — so sánh số lần render.
5. Dùng `useLayoutEffect` đo chiều cao tooltip rồi định vị, quan sát không bị nháy so với `useEffect`.

## Reference
- https://react.dev/learn/lifecycle-of-reactive-effects
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/useEffectEvent