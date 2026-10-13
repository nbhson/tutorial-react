# Q27: Cái gì thì em cho vào `useEffect`, cái gì thì không nên?

## Câu hỏi

> Khi nào thì dùng `useEffect`, và khi nào thì không nên
> (đặc biệt là tính toán data từ props/state rồi `setState`)?
> `useEffect` khác `useLayoutEffect` ở chỗ nào?
> Với external store thì nên tự viết `useEffect + useState` hay dùng `useSyncExternalStore`?
> `useEffectEvent` (React 19.2) giải quyết vấn đề gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Quy tắc 2026**: `useEffect` chỉ dành cho **đồng bộ với hệ thống ngoài** (timer, socket, DOM, subscription, fetch khi mount). **KHÔNG dùng để tính dữ liệu** từ props/state rồi `setState` — việc đó React làm **trực tiếp trong render** (derived data) hoặc để **đúng hook** (calc → biến, external store → `useSyncExternalStore`, DOM measurement → `useLayoutEffect`).
- **Vì sao cấm "effect tính data"**: render là **pure** (React chạy 2 lần dev/StrictMode để so) — nếu data "sinh ra" trong effect thì **render đầu thiếu data** (flashing), **race** (effect chạy sau paint, UI đã vẽ 1 frame giá trị cũ), và **loop** (effect → set state → render → effect…). Derived data **tính inline**: `const sorted = items.sort(...)` ngay trong render, không `useEffect + setItems`.
- **`useEffect` vs `useLayoutEffect`**: effect **sau paint** (mặc định, không chặn vẽ); layout **trước paint** (đo DOM rồi đặt — tooltip/popover không nháy). Giá layout: chặn paint (nặng là treo) → chỉ dùng khi **đo-đặt DOM**.
- **External store**: **`useSyncExternalStore`** (chính xác, chống **tearing** + batch + StrictMode double-subscribe đúng) — **không** tự viết `useEffect + useState` subscribe (dễ tearing khi concurrent).
- **`useEffectEvent`** (19.2+): tách "logic không reactive" (handler cần giá trị mới nhất) khỏi **deps** — thay cho `eslint-disable` (giấu stale) hay thêm deps (chạy lại thừa).

## Trả lời chi tiết

### 1. Effect chỉ cho "hệ thống ngoài" — vì sao (nói được = ăn điểm)

React có **2 pha rõ**: **render (pure, tính JSX)** và **commit (chạm DOM) + effect (sau commit)**. Mọi thứ **có thể tính từ props/state** → **thuộc render** (pure, chạy 2 lần dev, StrictMode). Mọi thứ **chỉ tồn tại ngoài React** (time, network, DOM size, subscription) → **thuộc effect**.

| Việc | Dùng gì | Vì sao |
|---|---|---|
| "Tính data mới từ data cũ" (sort, filter, sum, format) | **Biến trong render** (`const x = ...`) | Pure, React tự lo; effect = trễ + loop |
| "Tạo giá trị 1 lần, đắt" (parse JSON lớn) | **`useMemo(fn, [deps])`** | Cache tính (không phải effect) |
| "Đồng bộ với DOM/thứ ngoài" (đo, scroll, canvas) | **`useLayoutEffect`** (đo-đặt) / `useEffect` (không chặn paint) | Cần DOM thật (chỉ có sau commit) |
| "Nối socket/timer/subscription/fetch mount" | **`useEffect` + cleanup** | Hệ thống ngoài, có vòng đời (setup/cleanup) |
| "Đọc external store (Zustand/RTK)" | **`useSyncExternalStore`** | Chống tearing + batch + strict double-subscribe đúng |

### 2. "Tính data trong effect" — 3 hậu quả (nói cụ thể = ăn điểm)

```tsx
// ❌ SAI: sort rồi set state (effect tính data)
useEffect(() => { setItems(items.sort()); }, [items]); // render 1: items chưa sort (flash), rồi sort + setItems → render 2
// → 2 lần render, UI nhảy, + StrictMode double = 4 lần; items đổi là chạy lại (loop tiềm ẩn)

// ✅ ĐÚNG: tính trong render (derived) — không state, không effect
const sorted = [...items].sort(); // (bản copy để không mutate props)
// render luôn có data "sẵn" (pure) — không flash, không loop
```

Ba lỗi cùng lúc: (a) **flash** (render đầu thiếu data "đã tính"), (b) **thừa render** (effect set state → render thêm), (c) **loop** (deps đổi liên tục nếu data không "đến nơi ổn định"). Angular (class, tính trong getter/render) không dính dạng "effect-trễ" này — React **phân biệt rõ render (pure) vs effect (thời gian)**.

### 3. `useEffect` vs `useLayoutEffect` (chọn đúng = ăn điểm)

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Chạy | **Sau paint** (không chặn vẽ) | **Sau DOM, trước paint** (chặn) |
| Dùng | fetch, timer, subscription, log (không cần "vẽ trước") | **đo DOM rồi đặt** (tooltip/popover, không nháy) |
| Giá | rẻ (vẽ xong mới chạy) | **nặng là treo vẽ** (trả giá "không nháy") |

```tsx
// Đo chiều cao tooltip ĐÚNG (không nháy): useLayoutEffect
useLayoutEffect(() => { setTop(ref.current!.getBoundingClientRect().height); }, []);
// Vẽ lần đầu đã đúng vị trí — useEffect thì thấy "nhảy 1 frame" (vẽ trước, đo sau)
```
> SSR: `useLayoutEffect` không chạy server (warning) — đo DOM chỉ client. Ưu tiên `useSyncExternalStore` khi có thể (SSR-safe).

### 4. External store: `useSyncExternalStore` (KHÔNG tự viết effect)

Tự viết `useEffect + useState` để subscribe store:
- **Tearing**: 2 component đọc store **giữa 1 render** thấy **2 giá trị khác nhau** (concurrent, React 18).
- **StrictMode**: double-subscribe chưa đúng → subscription thừa.
- **Không batch**: store đổi → mỗi subscriber render riêng.

**`useSyncExternalStore(subscribe, getSnapshot)`** giải quyết **đúng 3 điểm** + **lazy/synchronous** (React "cân nhắc" giá trị giữa 2 render — không tearing). Với Zustand/RTK: hook (`useStore(selector)`/`useSelector`) **bên trong đã gọi `useSyncExternalStore`** — bạn dùng **selector hook**, không tự subscribe.

> (Liên hệ Q15: `getSnapshot` phải **trả cùng reference** khi data không đổi — trả object mới mỗi lần = "mãi đổi" = re-render vô ích.)

### 5. `useEffectEvent` (19.2+) — "đọc mới nhất mà không thêm deps"

Vấn đề kinh điển: handler trong effect cần **giá trị mới nhất** (message đang gõ, callback prop) nhưng **không muốn** effect chạy lại mỗi lần giá trị đổi (thừa cleanup/setup).

```tsx
// Trước (2 cách sai/khổ):
useEffect(() => { socket.on("msg", () => send(text)); }, [text, send]); // chạy lại mỗi phím (thừa)
// hoặc: useEffect(() => { socket.on("msg", () => send(text)); }, []); // eslint-disable (giấu stale)

// Sau (19.2): tách "logic không reactive" — handler LUÔN đọc mới nhất, deps SẠCH
import { useEffectEvent } from "react";
const onMsg = useEffectEvent(() => send(text)); // đọc text/send "hiện tại" (không nằm deps)
useEffect(() => {
  socket.on("msg", onMsg);
  return () => socket.off("msg", onMsg);
}, []); // deps [] sạch — không chạy lại, không stale
```

**Nguyên tắc**: effect = **reactive theo deps** (setup/cleanup theo "cái gì đổi"); `useEffectEvent` = **logic luôn-cập-nhất** (đọc giá trị mới nhất, không phản hồi). Tách 2 loại này = bỏ được `eslint-disable` (giấu stale) lẫn thêm deps (chạy lại thừa).

### 6. "useEffect, useMemo, useLayoutEffect, useSyncExternalStore — chọn cái nào" (1 trang, ăn điểm)

| Nhu cầu | Hook | Ghi chú |
|---|---|---|
| Tính data derived (sort/filter/sum) | **biến render** / `useMemo` (nếu đắt) | KHÔNG effect |
| Đo/đặt DOM trước paint | **`useLayoutEffect`** | tooltip/popover (không nháy) |
| Đồng bộ hệ thống ngoài (socket, timer, fetch mount) | **`useEffect` + cleanup** | setup/cleanup đối xứng (Q25) |
| Đọc external store | **`useSyncExternalStore`** (via selector hook) | chống tearing + batch |
| Handler cần giá trị mới nhất (không chạy lại effect) | **`useEffectEvent`** (19.2) | thay `eslint-disable` |
| Cache "kết quả tính" (không chặn render) | **`useMemo`** | khác `useCallback` (cache function) |

## Bẫy khi phỏng vấn

1. **"Tôi `useEffect` để sort/filter data rồi set state"** → **sai mô hình** (effect tính data): flash + thừa render + loop. Đúng: **derived trong render** (§2).
2. **"`useLayoutEffect` và `useEffect` như nhau, đổi tùy thích"** → **sai**: layout **chặn paint** (nặng = treo) — chỉ dùng **đo-đặt DOM**; phần còn lại `useEffect` (rẻ).
3. **"Tự viết `useEffect + useState` subscribe Zustand (thay vì `useStore`)"** → **tearing + không batch + strict sai**. Đúng: **`useSyncExternalStore`** (selector hook) — "tại sao hook store không viết effect" là câu hỏi ăn điểm.
4. **"Nhiều lần update effect (chạy lại mỗi render)"** → **deps mới mỗi lần** (object/array/function) — Q16 (viết tự nhiên / Compiler) + Q27 (deps nguyên thủy). "Chạy 1 lần" `[]` nhưng đọc state "trễ" (stale) → Q26 (stale closure) / `useEffectEvent`.
5. **Nói "effect là nơi 'tính toán dữ liệu' của React"** → **ngược**: render = tính (pure); effect = **đồng bộ thời gian/ngoài**. Hiểu sai gốc = dùng sai mọi hook (Q25).

## Gợi ý câu chốt

> "React chia rõ **render (pure, tính data)** và **effect (thời gian, đồng bộ ngoài)**. `useEffect` **chỉ cho hệ thống ngoài** (socket/timer/fetch mount) + **cleanup** — **không dùng để tính data rồi set state** (flash + loop; đúng là **derived trong render**). `useLayoutEffect` = **đo-đặt DOM trước paint** (tooltip, không nháy) — giá: chặn paint (nặng là treo). External store → **`useSyncExternalStore`** (chống **tearing** + batch + strict đúng), không tự viết effect. Handler cần **giá trị mới nhất** (không chạy lại effect) → **`useEffectEvent`** (19.2) — thay `eslint-disable` (giấu stale) lẫn thêm deps (chạy thừa). Tính data đắt → `useMemo` (cache tính), không effect."

## Reference

- [`3_react-tutorial/15-lifecycle-effects`](../../3_react-tutorial/15-lifecycle-effects) — "effect chỉ đồng bộ hệ thống ngoài", deps (thiếu=stale, thừa=loop), cleanup, `useLayoutEffect`, StrictMode 2 lần, `useEffectEvent`
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — "vì sao `useSyncExternalStore` thay `useEffect + useState` subscribe (tearing + batch + strict)"
- [`3_react-tutorial/16-custom-hooks`](../../3_react-tutorial/16-custom-hooks) — custom hook (composition), "prod: `useFetch` tự viết để học, TanStack để làm"
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — Compiler (code sạch = memo miễn phí), state gần nơi dùng
- Q25 (rules of hooks) — hook top-level + thứ tự (nền để hiểu "effect chạy theo deps")
- Q26 (batching + stale closure) — stale closure (đọc "trễ 1 nhịp") — liên hệ `useEffectEvent`

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q25 — rules of hooks (effect là hook)?](../25-rules-of-hooks/README.md) · [Q26 — stale closure (effect đọc state cũ)?](../26-batching-stale-closure/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — external store (useSyncExternalStore thay effect + useState)?](../15-external-stores/README.md) · [Q30 — effect chạy ở pha nào của pipeline render?](../30-rerender-pipeline/README.md)
