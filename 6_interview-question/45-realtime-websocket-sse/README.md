# Q45: Dữ liệu nhảy liên tục qua WebSocket, em đưa vào React sao cho không render loạn?

## Câu hỏi

> Nguồn real-time (WebSocket, SSE, Firebase) gửi dữ liệu liên tục (tick mỗi giây, nhiều sự kiện/mỗi giây) — làm sao đưa data đó vào React mà **không re-render cả app mỗi tick**?
> Nên subscribe ở đâu (component leaf, context, external store)? Khi nào dùng `useSyncExternalStore` (Q15) thay vì `useEffect + useState`? Lỗi "re-render loạn" thường gặp là gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Vấn đề gốc**: WebSocket/SSE gửi data liên tục → nếu mỗi event → `setState` trong component cha (top) → **cả cây re-render mỗi tick** (Q30 cascade). **Mục tiêu**: chỉ "component dùng data đó" re-render, không lan lên (Q16, Q30).
- **3 cách đưa data (theo "nhiều component dùng?") (Q15, Q16, Q30)**:
  1. **Component leaf (1 component dùng)**: `useEffect` subscribe (Q27) + `useState` (Q10) — "đơn giản, không cần context/store". "Sai khi nhiều component dùng (prop drilling, Q9, Q13) → cascade (Q30)".
  2. **External store (Zustand/Jotai + `useSyncExternalStore`) (Q15)**: store "nằm ngoài React", component "lấy giá trị bằng hook" (chỉ re-render khi giá trị đó đổi, Q15, Q30). **Chuẩn khi: nhiều component (khác tầng) dùng data real-time (Q13, Q15) mà không cascade (Q30)**.
  3. **Context (Q13) + `useMemo` value (Q14)**: "cùng tầng (Q13)", "không nên cho data tick mỗi giây (Q14 cascade — mỗi tick = value mới = tất cả consumer re-render, Q14, Q30)".
- **`useSyncExternalStore` (Q15)**: "hook React built-in (Q15, Q27), subscribe external store (Q15) mà không tearing (Q27), batch (Q26) — chuẩn cho data ngoài React (Q15)". **Sai khi dùng `useEffect + useState` (Q27) cho external store (Q15)**: tearing (Q27), không batch (Q26) (Q27, Q28).

## Trả lời chi tiết

### 1. "Re-render loạn" — vì sao (Q30, Q14)

```
// ❌ Sai (Q30 cascade, Q14) — WebSocket tick mỗi giây → setState (component cha (top)
function App() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const ws = new WebSocket("wss://...");
    ws.onmessage = (e) => setTick(JSON.parse(e.data).tick); // Mỗi tick → setState (cha)
    return () => ws.close();
  }, []);
  return <Dashboard tick={tick} />; // Cha (App) re-render mỗi tick (Q30 cascade (Q30)
}
// Mỗi tick: App (cha) re-render (Q30) → tất cả con (Dashboard, các widget (Q30 cascade (Q30)
// Không dùng (Q16, Q14, Q30) = "re-render loạn (Q14, Q30)"
```

**Sai (Q30, Q14)**: "set state (cha (top) (Q30) = **tất cả con re-render (Q30 cascade) (Q30)** — mỗi tick (Q30, Q14). **Không dùng (Q16, Q14, Q30) = "re-render loạn" (Q14, Q30)**.

### 2. Cách 1: Component leaf (1 component dùng) (Q10, Q27)

```tsx
// ✅ (Q10, Q27) — WebSocket (1 component leaf dùng (Q10, Q27)
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const ws = new WebSocket("wss://.../time");
    ws.onmessage = (e) => setNow(new Date(JSON.parse(e.data).ts)); // Mỗi tick → set state (leaf (Q10)
    return () => ws.close();
  }, []);
  return <span>{now.toLocaleTimeString()}</span>;
}
// Chỉ (LiveClock re-render (Q10, Q27) (không (cha (Q30 cascade) (Q30)
// (Q10, Q27) "đúng (1 component (Q10, Q27) — "sai (nhiều component (Q9, Q13) (Q9, Q13)
```

**Đúng khi**: **1 component leaf dùng** (Q10, Q27). **Sai khi**: **nhiều component dùng** (Q9, Q13) → "prop drilling (Q9, Q13) → cascade (Q30)" (Q9, Q13, Q30).

### 3. Cách 2: External store (Zustand/Jotai + `useSyncExternalStore`) (Q15)

```tsx
// ✅ (Q15) — External store (Zustand/Jotai (Q15), "useSyncExternalStore (Q15)
import { useSyncExternalStore } from "react";
// (Q15) "Store (Zustand/Jotai (Q15) — "WebSocket (update (store) (Q15)
function subscribeStore(callback) {
  const ws = new WebSocket("wss://...");
  ws.onmessage = (e) => { store.update(JSON.parse(e.data)); callback(); };
  return () => ws.close();
}
// (Q15) "Hook (Zustand/Jotai (Q15) — "useSyncExternalStore (Q15)
function useRealtimeTick() {
  return useSyncExternalStore(
    subscribeStore,                    // (Q15, Q27) "Subscribe (Q15)
    () => store.get().tick,            // (Q15) "Giá trị hiện tại (Q15)
    () => store.get().tick,            // (Q15) "Server snapshot (Q15) (SSR (Q2)
  );
}
// (Q15) "Chỉ (component dùng (tick) re-render (Q15, Q30) (không cascade (Q30)
// (Q15, Q30) "Chuẩn (nhiều component (khác tầng (Q13, Q15) (Q13, Q15)
```

**Đúng khi**: **Nhiều component (khác tầng (Q13, Q15), data tick mỗi giây (Q15)** — "external store (Q15) + `useSyncExternalStore` (Q15) = **chỉ (component dùng re-render (Q15, Q30)** (Q15, Q30). **Sai khi**: "useEffect + useState (Q27, Q10) cho external store (Q15)" — tearing (Q27), không batch (Q26) (Q27, Q28).

### 4. `useSyncExternalStore` vs `useEffect + useState` (Q15, Q27)

| | `useEffect + useState` (Q27, Q10) | `useSyncExternalStore` (Q15) |
|---|---|---|
| **Teaching (Q27)** | Tearing (Q27, Q28) (con (parent (khác (value) (Q27) | Không tearing (Q15) (Q15) |
| **Batch (Q26)** | Không batch (Q26, Q27) | Batch (Q26) (Q15) |
| **SSR (Q2)** | Không (Q2) | Có (Q15) (Q2) |
| **Khi nào dùng** | 1 component (Q10, Q27) | Nhiều component (Q13, Q15) (Q15) |

**Điểm ăn điểm (Q15)**: "External store (Zustand/Jotai (Q15) → `useSyncExternalStore` (Q15) (không `useEffect + useState` (Q27, Q10) — tearing (Q27), batch (Q26)" (Q15, Q26, Q27).

### 5. Khi nào dùng Context (Q13) (Q13, Q14)

| Case | Dùng (Q13) | Vì sao (Q13, Q14) |
|---|---|---|
| 1 component leaf (Q10, Q27) | `useEffect + useState` (Q10, Q27) | Đơn giản (Q10, Q27) (Q10, Q27) |
| Nhiều component (khác tầng (Q13, Q15) (Q13, Q15) | **External store (Q15)** | Không cascade (Q30) (Q15, Q30) |
| Cùng tầng (Q13, value ít đổi (Q13) | **Context (Q13)** | Prop drilling (Q9) (Q13) |
| Data tick mỗi giây (Q15) | **Không (Q13)** | Cascade (Q14, Q30) (Q14, Q30) |

**Điểm ăn điểm (Q13, Q14)**: "Context (Q13) cho data tick mỗi giây (Q15) → cascade (Q14, Q30) — sai (Q14, Q30). External store (Q15) = đúng (Q15, Q30)" (Q13, Q14, Q15).

## Bẫy khi phỏng vấn

1. **"useEffect + useState (Q27, Q10) cho external store (Q15)"** → **Sai (Q15, Q27)**: tearing (Q27), không batch (Q26) — `useSyncExternalStore` (Q15) đúng (Q15).
2. **"Context (Q13) cho data tick mỗi giây (Q15)"** → **Sai (Q14, Q30)**: cascade (Q14, Q30) (Q14) — External store (Q15) đúng (Q15, Q30).
3. **"Chặt (Q15) = không re-render (Q15)"** → **Sai (Q15, Q30)**: "chặt (Q15) (Q15), "chỉ (component dùng re-render (Q15, Q30) (Q15, Q30).
4. **"Không cần (Q15, Q27, Q10)"** → **Sai (Q15, Q27)**: "nhiều component (Q13, Q15) (Q13, Q15) cần (Q15, Q27, Q10)".

## Gợi ý câu chốt

> "Real-time (WebSocket/SSE) (Q15, Q30): "re-render loạn" (Q14, Q30) = set state (cha (top) (Q30) cascade (Q30) mỗi tick (Q15, Q30). **3 cách (Q15)**: (1) **1 component leaf** → `useEffect + useState` (Q10, Q27) (Q10, Q27); (2) **Nhiều component (khác tầng (Q13, Q15)** → **External store (Zustand/Jotai) (Q15) + `useSyncExternalStore` (Q15)** (Q15, Q30); (3) **Cùng tầng (value ít đổi (Q13)** → Context (Q13) (Q13). **Sai (Q14, Q30)**: Context (Q13) cho data tick (Q15) (Q14, Q30); `useEffect + useState` (Q27, Q10) cho external store (Q15) (Q15, Q27). **Điểm ăn điểm (Q15)**: `useSyncExternalStore` (Q15) = không tearing (Q27), batch (Q26) (Q15).

## Reference

- [`15-external-stores`](../15-external-stores/README.md) — "External store (Zustand/Jotai, `useSyncExternalStore` Q15)"
- [`14-context-rerender`](../14-context-rerender/README.md) — "Context (Q13, cascade (Q14, Q30)"
- [`30-rerender-pipeline`](../30-rerender-pipeline/README.md) — "Cascade (Q30, set state (cha (top)"
- [`27-which-effect-when`](../27-which-effect-when/README.md) — "`useEffect + useState` (Q27, tearing (Q27)"
- [`16-memo`](../16-memo/README.md) — "Memo (Q16, không cascade (Q30)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q15 — External stores (Zustand/Jotai, `useSyncExternalStore` Q15)?](../15-external-stores/README.md) · [Q14 — Context re-render (cascade (Q14, Q30)?](../14-context-rerender/README.md)
- **Đào sâu (xuyên nhóm)**: [Q30 — Re-render pipeline (cascade (Q30)?](../30-rerender-pipeline/README.md) · [Q16 — Memo (chặn cascade (Q16, Q30)?](../16-memo/README.md) · [Q27 — `useEffect` (torn (Q27)?](../27-which-effect-when/README.md)
