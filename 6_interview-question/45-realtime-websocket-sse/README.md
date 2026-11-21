# Q45: Dữ liệu nhảy liên tục qua WebSocket, em đưa vào React sao cho không render loạn?

## Câu hỏi

> Nguồn real-time (WebSocket, SSE, Firebase) gửi dữ liệu liên tục (tick mỗi giây, nhiều sự kiện/mỗi giây) — làm sao đưa data đó vào React mà **không re-render cả app mỗi tick**?
> Nên subscribe ở đâu (component leaf, context, external store)? Khi nào dùng `useSyncExternalStore` (Q15) thay vì `useEffect + useState`? Lỗi "re-render loạn" thường gặp là gì?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — chốt được "chỉ component nào dùng data mới render lại" là đã qua vòng đầu; phần chi tiết bên dưới để đỡ khi bị hỏi từng cách.

- **Vấn đề**: mỗi tick `setState` ở component cao thì **cả cây render lại mỗi giây**. Mục tiêu là chỉ component nào dùng data đó mới render lại.
- **3 cách theo số nơi dùng**: (1) Một component dùng → subscribe trong `useEffect` + `useState` ngay tại leaf, đặt càng thấp càng tốt. (2) Nhiều nơi dùng → external store (`useSyncExternalStore`/Zustand): mỗi component chỉ render lại khi lát mình đọc đổi. (3) Tránh Context cho data tick nhanh — mỗi tick là value mới, mọi consumer render lại hết.

## Trả lời chi tiết

Mục này giải thích vì sao "re-render loạn" xảy ra, rồi xếp 3 cách subscribe theo số nơi dùng data — đọc để trả lời được "subscribe ở đâu" một cách có lý do, không phải đoán.

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

> 📄 **Code ví dụ:** [`examples/01-2-cach-1-component-leaf-1-component-dung.tsx`](examples/01-2-cach-1-component-leaf-1-component-dung.tsx)

**Đúng khi**: **1 component leaf dùng** (Q10, Q27). **Sai khi**: **nhiều component dùng** (Q9, Q13) → "prop drilling (Q9, Q13) → cascade (Q30)" (Q9, Q13, Q30).

### 3. Cách 2: External store (Zustand/Jotai + `useSyncExternalStore`) (Q15)

> 📄 **Code ví dụ:** [`examples/02-3-cach-2-external-store-zustand-jotai-usesyncexternalstore.tsx`](examples/02-3-cach-2-external-store-zustand-jotai-usesyncexternalstore.tsx)

**Đúng khi**: **Nhiều component (khác tầng (Q13, Q15), data tick mỗi giây (Q15)** — "external store (Q15) + `useSyncExternalStore` (Q15) = **chỉ (component dùng re-render (Q15, Q30)** (Q15, Q30). **Sai khi**: "useEffect + useState (Q27, Q10) cho external store (Q15)" — tearing (Q27), không batch (Q26) (Q27, Q28).

### 4. `useSyncExternalStore` vs `useEffect + useState` (Q15, Q27)

| | `useEffect + useState` (Q27, Q10) | `useSyncExternalStore` (Q15) |
|---|---|---|
| **Teaching (Q27)** | Tearing (Q27, Q28) (con (parent (khác (value) (Q27) | Không tearing (Q15) (Q15) |
| **Batch (Q26)** | Không batch (Q26, Q27) | Batch (Q26) (Q15) |
| **SSR (Q2)** | Không (Q2) | Có (Q15) (Q2) |
| **Khi nào dùng** | 1 component (Q10, Q27) | Nhiều component (Q13, Q15) (Q15) |

> **Cách đọc bảng này:** mỗi dòng là một tiêu chí so sánh hai cách "bám" vào nguồn dữ liệu ngoài React; cột giữa là `useEffect + useState` (cách thủ công), cột phải là `useSyncExternalStore` (API chính chủ cho external store) — các dòng "Teaching (tearing)" và "Batch" là hai điểm kỹ thuật được hỏi nhiều nhất.

**Điểm ăn điểm (Q15)**: "External store (Zustand/Jotai (Q15) → `useSyncExternalStore` (Q15) (không `useEffect + useState` (Q27, Q10) — tearing (Q27), batch (Q26)" (Q15, Q26, Q27). Ví von: `useEffect + useState` cho external store giống chép tay tin từ đài vào vở rồi đọc lại cho cả nhóm — có lúc ghi chậm, có lúc chép nhầm nửa dòng; `useSyncExternalStore` là cả nhóm cùng nghe đài trực tiếp — không ai nghe "nửa tin mới nửa tin cũ" (tearing).

### 5. Khi nào dùng Context (Q13) (Q13, Q14)

| Case | Dùng (Q13) | Vì sao (Q13, Q14) |
|---|---|---|
| 1 component leaf (Q10, Q27) | `useEffect + useState` (Q10, Q27) | Đơn giản (Q10, Q27) (Q10, Q27) |
| Nhiều component (khác tầng (Q13, Q15) (Q13, Q15) | **External store (Q15)** | Không cascade (Q30) (Q15, Q30) |
| Cùng tầng (Q13, value ít đổi (Q13) | **Context (Q13)** | Prop drilling (Q9) (Q13) |
| Data tick mỗi giây (Q15) | **Không (Q13)** | Cascade (Q14, Q30) (Q14, Q30) |

> **Cách đọc bảng này:** mỗi dòng là một hoàn cảnh (ai dùng data, tick nhanh hay chậm); cột "Dùng" là lựa chọn — đọc dọc để thấy quy luật: data tick nhanh thì Context là "cấm", external store là "đúng".

**Điểm ăn điểm (Q13, Q14)**: "Context (Q13) cho data tick mỗi giây (Q15) → cascade (Q14, Q30) — sai (Q14, Q30). External store (Q15) = đúng (Q15, Q30)" (Q13, Q14, Q15).

> **Tóm gọn 1 câu:** Data real-time như cái đồng hồ chạy từng giây — đừng treo nó ở nóc nhà cho cả toà nhìn (cascade); cứ để đúng người cần xem mới ngẩng lên (leaf), đông người thì mua một cái store chung theo dõi (`useSyncExternalStore`).

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — real-time là chủ đề dễ nhầm "đặt state đâu cũng được".

1. **"useEffect + useState (Q27, Q10) cho external store (Q15)"** → **Sai (Q15, Q27)**: tearing (Q27), không batch (Q26) — `useSyncExternalStore` (Q15) đúng (Q15).
2. **"Context (Q13) cho data tick mỗi giây (Q15)"** → **Sai (Q14, Q30)**: cascade (Q14, Q30) (Q14) — External store (Q15) đúng (Q15, Q30).
3. **"Chặt (memo/slice) là không re-render"** → **sai** (Q15, Q30): "chặt" chỉ là thu nhỏ vùng render (Q16, Q30) — component nào đọc data thì vẫn re-render khi lát nó đọc đổi (Q15, Q30); mục tiêu đúng là "chỉ component dùng mới render lại", không phải "không ai render lại".
4. **"Không cần `useSyncExternalStore`, `useEffect + useState` là đủ"** → **sai** (Q15, Q27): khi nhiều component (khác tầng) dùng cùng nguồn (Q13, Q15) thì cần `useSyncExternalStore` (Q15) — không tearing, có batch (Q26, Q27).

> **Tóm gọn 1 câu:** Bẫy lớn nhất là treo tick vào Context hoặc state ở nóc nhà — mỗi giây là cả cây re-render; để tick sống ở store ngoài, component nào đọc mới tốn CPU.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

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
