# Q38: App chạy được nhưng chậm, không biết nghẽn ở đâu — em soi bằng gì, soi theo thứ tự nào?

## Câu hỏi

> App "trễ" / "giật" — làm sao biết **chậm ở đâu** (render, layout, JS, paint) trước khi tối ưu?
> Công cụ profile chuẩn là gì, quy trình đúng (đo → nghi ngờ → sửa → đo lại) là ra sao?
> Sai lầm phổ biến nhất khi "nghiên cứu performance" (chưa đo đã sửa, `useMemo` lan tràn) là gì?

## Trả lời ngắn (elevator pitch, 30 giây)
- Luật đầu: **đo trước sửa sau**. Quy trình: profile → tìm pha tốn (vẽ CPU, layout/paint, JS main thread, RAM) → sửa đúng pha → đo lại, giữ ngưỡng ở CI.
- 4 đồ nghề: Performance tab (xem main thread, frame rớt), Profiler của React DevTools (xem component nào vẽ lâu/vẽ nhiều), Lighthouse (LCP/INP), web-vitals + Sentry cho số liệu thật ở production.
- Bẫy phổ biến: chưa đo đã rải `useMemo` khắp nơi — vừa rối code vừa không trúng bệnh.

## Trả lời chi tiết

### 1. Quy trình "đo trước, sửa sau" (4 bước)

| Bước | Công cụ | Làm gì |
|---|---|---|
| 1. Profile | Chrome DevTools Performance / React DevTools Profiler | "Record 30s thao tác", ghi lại Main thread + commit + layout + flame graph |
| 2. Xác định pha | Flame graph + "Frames" | **Render** (CPU cao, nhiều commit) → Q16/Q29 · **Layout/Paint** (long task, DOM nhiều) → Q31 · **JS Main** (blocking, long task) → Web Worker · **Network** (blocking) → Q20/Q22 |
| 3. Sửa | Theo pha | (Q16 memo, Q29 transition, Q31 virtual, Q23 code split, Web Worker) |
| 4. Đo lại | Cùng profile | **Xác nhận** metric cải thiện (không "nghi ngờ là đã nhanh") |

**Budget CI (Q23)**: script `bun run check:perf` (Lighthouse INP < 200ms, JS critical < 200KB gzip) — "chống phình lại".

### 2. Chrome DevTools → Performance (đọc flame graph)

- **Record** khi thao tác "chậm" (click nút, scroll list, search) — **30s đủ** (không ghi 5 phút = khó đọc).
- **Frames panel** (đáy): **frame drop** (giật = frame vượt 16ms). "Red triangle" = long task blocking.
- **Main thread** (vùng giữa): **function call stack** (flame graph) — **càng dầy = càng tốn**.
  - `setState → React.render → ...` (CPU render nhiều) → Q16 memo / Q29 transition
  - `layout`/`repaint` (DOM) → Q31 virtual / DOM tối giản
  - `async` (fetch/parse) → `await` hoặc **Web Worker** (heavy compute — Q "nút lag 200ms")
- **Network** (đáy): **blocking request** (render bị chặn) → `defer`/`async`, `React.lazy` (Q23).

### 3. React DevTools → Profiler (đọc commit per component)

- **"Record changes when a component updates"**:
  - **Commit table**: mỗi lần commit = 1 row (component nào chạy, ms, "why").
  - **Flame graph (function call)**: "Ai tốn?" — component function + hook (CPU).
- **KPI đọc**:
  - Component **chạy > 50 lần trong 1 thao tác** = **thừa** (Q16 memo / Q30 cascade) — "ai truyền props mới, ai thiếu `useMemo` (value object)".
  - Component **đắt (> 50ms)** = **đáng optimize** (Q16/Q29) — "chia nhỏ, lazy, virtual (Q31)".
  - **`useEffect` chạy lại** (deps sai — Q27) = "fix deps" (không "xóa effect").
- **`why` tooltip** (React 19): "This component re-rendered because its parent re-rendered" (Q30 cascade) — "nối" render (nên memo) vs state (nên dùng hook đúng).

### 4. Web Vitals (production, user thật) — 3 metric chuẩn 2026

| Metric | Đo gì | Target (INP thay FID 2024+) |
|---|---|---|
| **LCP** (Largest Contentful Paint) | "Trang render xong phần chính" | < 2.5s (good) |
| **INP** (Interaction to Next Paint) | "User bấm → UI phản hồi" | < 200ms (good) |
| **CLS** (Cumulative Layout Shift) | "UI nhảy (layout shift)" | < 0.1 (good) |

**Đo production**: `web-vitals` (lib) → báo Sentry/DataDog (theo cohort device). **Chống "giật INP"**: nút bấm chạy tính toán nặng → **Web Worker** (Q "nút lag 200ms") / `startTransition` (Q29, "đắt được hoãn").

### 5. Bẫy "chưa đo đã sửa" (thường gặp)

| Sai | Sửa đúng |
|---|---|
| "Chậm" → `useMemo` cho hết | Profile → tìm "ai tốn" → memo (Q16) đúng chỗ |
| "Scroll giật" → "chưa virtual" (giả thiết) | Profile Layout (250k node?) → Q31 (list ngắn = không cần virtual) |
| "Gõ tìm kiếm" → `debounce` (giả sử) | Profile: filter 10k item (CPU) → Q29 `useDeferredValue`/`startTransition` (không debounce, "đúng" hơn) |
| "App nặng" → "nâng cấp React" | Profile: code bundle (Q23) / cache (Q32) — "phần khác" |

## Bẫy khi phỏng vấn

1. **"Chậm → useMemo cho hết" (bẫy #1)** → **sai** (Q16) — profile trước, "nhiều useMemo = code méo, không giúp nếu bottleneck khác" (layout, network, main thread).
2. **"`useCallback`/`useMemo` = tối ưu" (thừa số)** → **sai** (Q16) — chỉ có ý nghĩa khi "truyền function/object cho con memo" (Q11, Q30) — "đo trước".
3. **"INP = FID (FID cũ)"** → **sai** (2024+ FID deprecated, **INP** thay — "nói được = ăn điểm").
4. **"Profile chỉ cần DevTools, không cần production"** → **sai** (user thật = device chậm, network thật — `web-vitals` + Sentry, không "vì sao dev nhanh mà prod chậm").

## Gợi ý câu chốt

> "Chậm = **đo trước, sửa sau** (không 'nghi ngờ rồi useMemo hết' — Q16). **4 công cụ (2026)**: (1) Chrome DevTools **Performance** (Main thread, Frames, flame graph — 'ai tốn'), (2) **React DevTools Profiler** (commit per component, 'ai render thừa, ai đắt' — Q30 cascade), (3) **Lighthouse** (LCP/INP/CLS — target: LCP<2.5s, INP<200ms, CLS<0.1 — INP thay FID 2024+), (4) **`web-vitals`** + Sentry (production, cohort thật). **Sửa theo pha**: render (Q16/Q29), layout (Q31), JS long (Web Worker), network (Q20/Q22/Q23). **Quét lại**: budget CI (Q23), 'chống phình lại'."

## Reference

- [`16-memo`](../16-memo/README.md) — "Khi nào memo thật sự giúp", "bẫy useMemo lan tràn"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "Gõ tìm kiếm, list giật → `useDeferredValue`"
- [`23-bundle-size`](../23-bundle-size/README.md) — "Code splitting, vendor, budget CI"
- [`31-virtualization`](../31-virtualization/README.md) — "Layout nhiều node → virtual"
- Web Vitals (Chrome DevTools, `web-vitals` lib, INP/FID transition 2024+)
- [React DevTools → Profiler docs](https://react.dev/learn/inspecting-react-elements-with-react-devtools)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q16 — useMemo/memo khi nào thật sự giúp?](../16-memo/README.md) · [Q30 — render pipeline (schedule → render → commit)?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q29 — search list nặng, deferred/transition?](../29-concurrency-transition-deferred/README.md) · [Q23 — code split, bundle size?](../23-bundle-size/README.md) · [Q31 — list nhiều node, virtualize?](../31-virtualization/README.md)
