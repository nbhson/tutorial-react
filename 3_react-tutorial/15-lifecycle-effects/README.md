# DAY 15: LIFECYCLE & EFFECTS

## Mục tiêu bài học
- Nắm `useEffect` thay cho bộ `ngOnInit/ngOnChanges/ngOnDestroy` của Angular, và `useLayoutEffect` cho việc đo DOM trước khi trình duyệt vẽ.
- Khắc cốt quy tắc 2026: effect chỉ dành cho **đồng bộ với hệ thống ngoài** (timer, socket, DOM, subscription) — không dùng để tính toán dữ liệu từ props/state.
- Hiểu dùng `useEffectEvent` (React 19.2+) thay cho việc `eslint-disable` dependencies, và vì sao StrictMode chạy effect 2 lần ở dev.

## Khái niệm cốt lõi (Core)

### 1. Effect = side effect sau render, chạy theo deps
`useEffect(fn, deps)` — React gọi `fn` **sau khi đã vẽ** (paint) khi `deps` đổi (so `Object.is` từng phần tử). Không có lifecycle methods rời; chỉ có "effect nào chạy lại khi gì đổi". Hỏi "viết effect khi nào" thì trả lời bằng deps.

```tsx
// example.tsx có 3 effect mẫu 3 loại deps:
useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []); // [] = 1 lần sau mount (ngOnInit)
useEffect(() => { document.title = `User ${userId} — ...`; }, [userId, now]); // [x] = lại khi x đổi (ngOnChanges cho x)
useEffect(() => { onConnected(); }, []); // với EffectEvent bên trong — deps sạch
// Không deps (useEffect(fn)) = sau MỌI render — hầu như luôn sai (loop/thừa)
```

Vì sao sau paint? Để effect nặng (fetch, đo DOM, subscribe) không chặn lần vẽ đầu — user thấy skeleton ngay. Cần đo trước paint để tránh nháy (tooltip) thì `useLayoutEffect` (mục 4).

### 2. Deps quyết định vòng đời — thiếu là stale, thừa là loop
`[]` = 1 lần (init); `[x]` = lại khi x đổi; không truyền = mọi render. Thiếu (dùng `userId` mà không liệt kê) là closure cũ (title mãi user 1 dù prop đã 2). Thừa (object/array/function mới mỗi render trong deps) là chạy lại mỗi render, thường thành loop (effect setState → render → object mới → effect lại).

```tsx
// ❌ Thiếu: title kẹt user cũ
useEffect(() => { document.title = `User ${userId}`; }, []); // userId đổi không chạy lại

// ✅ Đủ:
useEffect(() => { document.title = `User ${userId}`; }, [userId]);

// ❌ Thừa: options mới mỗi render -> fetch mỗi render
useEffect(() => { fetch(url, { headers: {} }); }, [{ headers: {} }]); // object mới mỗi lần

// ✅ Gọn: deps nguyên thủy ổn định
const token = auth.token;
useEffect(() => { fetch(url, { headers: { token } }); }, [url, token]);
```

ESLint `react-hooks/exhaustive-deps` báo thiếu/thừa — nghe nó, không disable. Vướng "muốn đọc giá trị mới mà không chạy lại" thì `useEffectEvent` (mục 6), không phải disable.

### 3. Cleanup = ngOnDestroy + "gỡ cũ trước khi gắn mới"
`return () => {...}` chạy (a) trước lần effect kế tiếp (khi deps đổi) và (b) khi unmount. Mọi setup (interval, socket, listener, subscribe, AbortController) phải có cleanup đối xứng: tạo bao nhiêu, gỡ bấy nhiêu.

```tsx
// example.tsx Effect #1: setup interval -> cleanup clear
useEffect(() => {
  const id = window.setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(id); // unmount hoặc (nếu có deps đổi) trước lần sau
}, []);
```

Vì sao "gỡ cũ trước mới"? Vì deps đổi (`roomId` 1→2) mà không gỡ socket cũ là 2 socket song song, message cũ vẫn về. Cleanup chạy trước effect mới nên cũ chết trước khi mới sinh — không chồng.

### 4. `useLayoutEffect` — trước paint, cho đo DOM
`useEffect` sau paint (mặc định, không chặn vẽ). `useLayoutEffect` sau DOM dựng nhưng **trước paint** — đo (`getBoundingClientRect`) rồi `setState` vị trí (tooltip/popover) thì trình duyệt vẽ 1 lần đúng vị trí, không nháy từ sai sang đúng. Giá: chặn paint nên nặng là treo vẽ — chỉ dùng khi cần đo-đặt.

```tsx
// Đo tooltip để không nháy (không trong ví dụ clock, nhưng là ca chuẩn):
import { useLayoutEffect, useRef, useState } from "react";
function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => { setTop(ref.current!.getBoundingClientRect().height); }, []);
  // Vẽ lần đầu đã top đúng — không thấy nhảy. useEffect thì thấy nhảy 1 frame.
  return <div ref={ref} style={{ top }}>Hi</div>;
}
```

SSR: `useLayoutEffect` không chạy server (cảnh báo) — đo DOM chỉ client. React 19 khuyên `useSyncExternalStore` cho đo đạc SSR-safe khi có thể.

### 5. StrictMode dev chạy 2 lần — máy báo khói cleanup
Setup → cleanup → setup. Thiếu cleanup (2 timer, 2 socket, 2 listener) là dev lộ ngay (đếm 2 lần, message kép). Prod 1 lần. Đừng bỏ StrictMode cho "hết 2 lần" — sửa effect. Kiểm thử với StrictMode bật để lộ trước khi lên prod.

### 6. `useEffectEvent` (19.2+) — đọc mới nhất không thêm deps
Tách "logic không reactive" (handler cần giá trị mới nhất: message đang gõ, callback prop) khỏi deps. Trước đây phải `eslint-disable` (giấu stale) hoặc thêm deps gây chạy lại thừa. Giờ handler `useEffectEvent` luôn đọc mới nhất mà không nằm trong deps.

```tsx
// example.tsx: onConnected đọc first/last mới nhất, effect deps sạch
const onConnected = useEffectEvent(() => {
  console.log("Connected, tên hiện tại:", first, last);
});
useEffect(() => { onConnected(); }, []); // deps [] — đổi tên không reconnect, log vẫn tên mới
// So sánh: thêm [first, last] vào deps là gõ mỗi phím reconnect (sai); disable lint là giấu stale (sai hơn)
```

Quy tắc: `useEffectEvent` không nằm trong deps bao giờ (lint biết). Chỉ dùng trong effect/event của cùng component, không truyền xa như prop thường mà không suy nghĩ.

### 7. Effect đồng bộ, không phải "chạy khi click/prop đổi để setState"
"Khi user click" là việc event handler (trong `onClick`, không phải effect). "Khi prop X đổi để tính Y" là derived trong render (`const y = f(x)`) hoặc `key` reset — không phải `useEffect(() => setY(f(x)), [x])` (thừa 1 vòng render + dễ loop). Effect chỉ khi có **hệ thống ngoài** cần giữ đồng bộ (timer/socket/DOM/subscription/fetch managed xem DAY 12).

```tsx
// ❌ Anti-pattern: effect đồng bộ prop -> state (thừa vòng, dễ loop)
useEffect(() => setFullName(first + " " + last), [first, last]);

// ✅ Derived trong render (example.tsx fullName) — không effect, không vòng thừa
const fullName = `${first} ${last}`;
```

### Keyword chính
`useEffect` (sau paint) / `useLayoutEffect` (trước paint, đo DOM), deps (`[]`/`[x]`/không có), cleanup (đối xứng setup), StrictMode double (máy báo khói), `useEffectEvent` (đọc mới không deps), stale closure (thiếu deps), derived (render thay effect), external system (khi nào mới effect).

## Luồng hoạt động (Flow)
1. Mount `App`: `useState(new Date())` (lazy init 1 lần), `first/last` input. Render đầu: `<p>Đồng hồ>`, `fullName` derived, 2 input. Chưa effect nào chạy.
2. Sau paint: Effect #1 (`[]`) chạy — `setInterval` 1s, trả cleanup. Effect #2 (`[userId, now]`) chạy — `document.title = "User 1 — ..."`. Effect #3 (`[]` + EffectEvent) chạy — `onConnected()` log tên hiện tại.
3. Mỗi giây: interval `setNow(new Date())` → re-render → `now` mới → `fullName` (không đổi vì first/last giữ) tính lại rẻ → Effect #2 deps `now` đổi → (không cleanup vì không có) chạy lại, title giờ mới. Effect #1 (`[]`) đứng yên.
4. Gõ tên: `setFirst` → re-render → `fullName` mới ngay (không effect, không chờ) → input hiện. Effect #3 không chạy lại (deps `[]`, `onConnected` ngoài deps) nhưng lần gọi sau (nếu có reconnect) vẫn đọc tên mới nhờ EffectEvent.
5. `userId` prop 1→2: Effect #2 chạy lại (deps đổi), title user 2. Effect #1 không chạy (deps `[]`) — timer giữ, không reset. Đây là ý nghĩa tách effect theo mối quan tâm (timer riêng, title riêng).
6. Unmount: cleanup Effect #1 `clearInterval` (không timer rò), Effect #2 không cleanup (gán đè, không cần gỡ). Không `setState` sau unmount.
7. Dev StrictMode: mount → setup → cleanup → setup cho cả 3 effect. Timer tạo/hủy/tạo (còn 1), title gán 2 lần (idempotent, không sao), log 2 lần (biết là dev, không phải bug).
8. Deps object mới mỗi render (nếu có) → so tham chiếu khác → effect chạy mỗi render → `setState` trong effect → loop. Fix: nguyên thủy/useMemo/Compiler + EffectEvent cho phần không reactive.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx`:

```tsx
// example.tsx — DAY 15: clock + title + useEffectEvent + derived (khớp README)
// Mục đích: effect chỉ cho hệ thống ngoài (timer/DOM) — data tính trong render.
import { useEffect, useEffectEvent, useState } from "react"; // (1) Effect đồng bộ ngoài, EffectEvent đọc mới nhất không thêm deps

export default function App({ userId = "1" }: { userId?: string }) {
  const [now, setNow] = useState(() => new Date()); // (2) Lazy init Date — chỉ tạo 1 lần mount, không mỗi render
  const [first, setFirst] = useState("Son"); // (3) Demo derived: first/last đổi thì fullName tính trong render (không effect)
  const [last, setLast] = useState("Nguyen");

  // (4) Effect #1 — ngOnInit + ngOnDestroy: timer là hệ thống ngoài, chạy sau paint, cleanup khi unmount.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000); // functional set, không cần deps now
    return () => clearInterval(id); // cleanup đối xứng — StrictMode dev setup->cleanup->setup lộ thiếu là 2 timer
  }, []); // deps [] = 1 lần sau mount

  // (5) Effect #2 — ngOnChanges cho [userId, now]: DOM ngoài (document.title) đồng bộ sau mỗi render đổi.
  // Không cleanup vì gán title idempotent (lần sau ghi đè, không cần gỡ).
  useEffect(() => {
    document.title = `User ${userId} — ${now.toLocaleTimeString("vi-VN")}`;
  }, [userId, now]); // thiếu userId/now là stale (title cũ); thừa object mới mỗi render là loop

  // (6) useEffectEvent: handler đọc first mới nhất mà effect [roomId] không cần liệt kê — thay eslint-disable.
  const onConnected = useEffectEvent(() => {
    console.log("Connected, tên hiện tại:", first, last); // luôn mới nhất dù effect không deps first/last
  });
  useEffect(() => {
    onConnected(); // deps chỉ [] demo — thật là connect(roomId) + deps [roomId]
  }, []); // onConnected KHÔNG nằm trong deps (quy tắc EffectEvent)

  // (7) Derived trong render — KHÔNG effect: tổng/filter/tên đầy đủ tính trực tiếp, không thêm vòng render.
  const fullName = `${first} ${last}`; // ✅ đúng; ❌ useEffect(() => setFullName(...), [first, last]) là thừa 1 vòng + dễ loop

  return (
    <>
      <p>Đồng hồ: {now.toLocaleTimeString("vi-VN")}</p>
      <p>User: {userId} — Tên: {fullName}</p>
      <input value={first} onChange={(e) => setFirst(e.target.value)} aria-label="Tên" />
      <input value={last} onChange={(e) => setLast(e.target.value)} aria-label="Họ" />
    </>
  );
}
```

## Giải thích từng phần
- Dòng `useState(() => new Date())`: lazy init (truyền hàm) — `new Date()` chỉ chạy mount, không mỗi render. Vì sao? Vì `useState(new Date())` (không hàm) tạo Date mới mỗi render rồi bỏ (phí + gây nhầm khi ai đó dùng nó làm deps).
- Khối Effect #1 (`[]`): "khởi tạo hệ thống ngoài" (interval). `window.` để đúng type browser (`number` id). Functional `setNow(new Date())` không cần `now` trong deps. Cleanup `clearInterval` — unmount + StrictMode double đều sạch. Không cleanup là 2 timer dev, 1 timer rò prod sau unmount.
- Khối Effect #2 (`[userId, now]`): đồng bộ DOM ngoài (`document.title`) — hệ thống ngoài nên effect đúng chỗ (không phải trong render vì render phải pure). Không cleanup vì gán đè (idempotent). Thiếu `now` là giờ kẹt; thiếu `userId` là user kẹt; thêm object lạ là loop.
- Khối `useEffectEvent`: `onConnected` đọc `first/last` mới nhất mà không reactive. Vì sao không `useCallback([first, last])`? Vì callback deps đổi mỗi phím → effect `[roomId, onConnected]` reconnect mỗi phím (sai). EffectEvent giữ effect `[roomId]` sạch mà handler vẫn mới.
- Dòng `onConnected()` trong effect `[]`: demo — thật là `connect(roomId)` + `conn.on("connected", onConnected)` + cleanup `disconnect`. `onConnected` không trong deps (lint không đòi) — cho vào là sai quy tắc (dù không loop vì EffectEvent ổn định, nhưng sai ý).
- Dòng `const fullName = ...` trong render: derived — rẻ, đồng bộ ngay, không vòng render thừa. Effect version (`setFullName` trong effect) tốn 1 render (render → effect → set → render lại) + nháy (lần đầu sai, lần 2 mới đúng) + dễ loop nếu deps sai.
- Quy tắc **nhiều effect theo mối quan tâm**: timer + title + socket là 3 effect, không gộp 1. Vì sao? Vì deps khác nhau (timer `[]`, title `[userId, now]`, socket `[roomId]`) — gộp là deps hợp nhất chạy thừa (gõ tên cũng reset timer).
- Quy tắc **render pure**: `document.title`/fetch/`localStorage.setItem` trong render là sai (mỗi render làm 1 lần, StrictMode double làm 2 lần). Pure (cùng props/state → cùng JSX) + side effect ở effect/event. `fullName` trong render đúng vì thuần (không đụng ngoài).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ngOnInit` (1 lần sau init) | `useEffect(fn, [])` (sau paint) | Cùng 1 lần, React sau vẽ nên không chặn |
| `ngOnChanges` (khi input đổi) | `useEffect(fn, [prop])` | Chạy lại khi prop trong deps đổi |
| `ngOnDestroy` | `return () => cleanup` trong cùng effect | Setup/cleanup colocate, không file rời |
| `ngAfterViewInit` (đo DOM sau view) | `useLayoutEffect` (trước paint) | Đo rồi set để không nháy |
| `ngDoCheck` (check tay mỗi vòng) | Không tương đương — derived trong render | Không vòng check, tính khi render |
| Subscription `.unsubscribe()` trong destroy | cleanup `return () => unsub()` | Không quên vì colocate |
| `ChangeDetectorRef.detectChanges()` ép vẽ | `setState` (tự re-render) | Không ép, báo state là vẽ |
| `zone.js` điều phối async | React scheduler (không zone) | Không patch global |
| `ngAfterContentInit` | Không effect tương ứng — traversal trong render (DAY 9) | Content không lifecycle riêng |
| `NgZone.runOutsideAngular` (tránh check) | Không cần — effect + deps kiểm soát | Không zone để tránh |

## Lỗi thường gặp (Common pitfalls)

### 1. Thiếu deps (stale closure) — effect giữ giá trị cũ
```tsx
// ❌ SAI: userId đổi nhưng title kẹt user 1 (effect không chạy lại)
useEffect(() => { document.title = `User ${userId}`; }, []);
```
```tsx
// ✅ ĐÚNG: đủ deps; vướng "không muốn chạy lại" thì EffectEvent (không disable lint)
useEffect(() => { document.title = `User ${userId}`; }, [userId]);
// Muốn [] mà đọc mới: const onTitle = useEffectEvent(() => { document.title = `User ${userId}`; });
```

### 2. Thừa deps (object/function mới mỗi render) → loop
```tsx
// ❌ SAI: opts mới mỗi render -> fetch mỗi render -> setData -> render -> loop
useEffect(() => { fetch(url, opts).then(setData); }, [opts]); // opts = { headers: {} } mới mỗi lần
```
```tsx
// ✅ ĐÚNG: deps nguyên thủy ổn định; object cần thì memo; handler mới nhất thì EffectEvent
const token = auth.token;
useEffect(() => { fetch(url, { headers: { token } }).then(setData); }, [url, token]);
```

### 3. Effect đồng bộ prop → state (thừa vòng + loop)
```tsx
// ❌ SAI: thêm 1 vòng render, sai là loop (set trong effect trigger effect)
useEffect(() => setFullName(first + " " + last), [first, last]);
```
```tsx
// ✅ ĐÚNG: derived trong render; reset ngữ nghĩa thì key (DAY 2)
const fullName = `${first} ${last}`;
// <Profile key={userId} userId={userId} /> khi đổi user cần state sạch
```

### 4. Quên cleanup (timer/listener/socket/subscribe)
```tsx
// ❌ SAI: unmount vẫn tick/socket/message — rò + setState unmounted
useEffect(() => { window.addEventListener("resize", onResize); }, []);
```
```tsx
// ✅ ĐÚNG: setup nào cleanup đó, cùng số lượng
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, [onResize]); // onResize ổn định (Compiler/useCallback) hoặc EffectEvent để deps []
```

### 5. Bỏ StrictMode cho hết "2 lần" → che bug
Mô tả: log/effect 2 lần dev nên gỡ StrictMode. Sai vì bug (thiếu cleanup) vẫn đó, prod user gánh. Fix: giữ StrictMode, viết cleanup đối xứng; 2 lần dev miễn phí, prod 1 lần.

### 6. Side effect trong render thay vì effect/event
```tsx
// ❌ SAI: render phải pure — mỗi render fetch/setTitle/lưu storage 1 lần, double 2 lần
function App({ userId }) { document.title = userId; fetch(url).then(setData); return <p>Hi</p>; }
```
```tsx
// ✅ ĐÚNG: pure render + effect/event cho ngoài
function App({ userId }) {
  useEffect(() => { document.title = userId; }, [userId]);
  const onClick = () => fetch(url).then(setData); // event, không phải effect
  return <p>Hi</p>;
}
```

### 7. Gộp nhiều mối quan tâm 1 effect → chạy thừa
Mô tả: timer + title + socket trong 1 effect deps `[userId, now, roomId]` — gõ tên cũng reconnect socket + reset timer. Fix: mỗi effect 1 tài nguyên như example (3 effect riêng).

## Best practices / Mẹo
- **Hỏi trước khi viết:** "Có hệ thống ngoài nào cần đồng bộ không?" Không → render/event, không effect. Vì sao hỏi? Vì 80% effect thừa là tính derived/fetch managed — bỏ được.
- Deps đúng dù có Compiler (Compiler không chữa logic stale). Vì sao? Vì Compiler memo tham chiếu, không biết bạn *muốn* effect chạy khi nào — deps là ý đồ, phải viết đúng.
- `useEffectEvent` khi cần mới nhất (analytics/socket/theme) mà không thêm deps. Vì sao hơn disable? Vì disable giấu stale (sai ngầm), EffectEvent đọc mới thật (đúng).
- Đo DOM → `useLayoutEffect`; SSR nhớ nó không chạy server. Vì sao? Để không nháy (đo trước paint) mà không treo vẽ (chỉ đo nhẹ).
- Data fetching managed (TanStack DAY 12), không effect-fetch tay ở prod. Vì sao? Vì cache/retry/dedupe tự viết dễ sai từng cái.
- **Effect nhỏ độc lập** (mỗi 1 timer/socket/DOM) — dễ deps, dễ cleanup, dễ test. Vì sao? Vì effect to là deps hợp nhất chạy thừa.
- **Sự kiện hơn effect** cho "khi user làm X" — effect là đồng bộ (giữ khớp với ngoài), không phải bắt sự kiện (phản ứng click/gõ).

## Bài tập nhỏ
1. `useWindowSize` (`resize` + cleanup) — StrictMode không lỗi, unmount bỏ listener. Thiếu cleanup thì `getEventListeners(window)` tăng thế nào?
2. Effect #2 sang EffectEvent đọc `userId` mới giữ deps `[]` — so với bản `[userId]` (cả hai đúng, khi nào mỗi cách hợp? Gợi ý: title cần chạy lại khi userId đổi → `[userId]` tự nhiên hơn).
3. `useEventListener(target, type, handler)` bọc add/cleanup (handler qua EffectEvent để deps `[]`) — dùng cho `resize`/`online`.
4. Effect `setState` theo prop → derived trong render — đếm render 2 bản (effect thừa mấy lần?).
5. `useLayoutEffect` đo tooltip vs `useEffect` — quay slow-motion thấy nháy khác nhau thế nào?

## Reference
- https://react.dev/learn/lifecycle-of-reactive-effects
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/useEffectEvent
