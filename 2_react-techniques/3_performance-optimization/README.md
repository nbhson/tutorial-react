# Performance Optimization — Tổng quan

> Nguồn: https://react.dev/learn/render-and-commit — https://react.dev/reference/react/useDeferredValue — https://react.dev/learn/react-compiler

Nhóm này cover **tối ưu hiệu năng render & tải** cho app React 19: memoization tự động bằng React Compiler, render cửa sổ cho list khổng lồ, chia nhỏ bundle, và lập lịch render theo ưu tiên. Triết lý chung: **đo trước, tối ưu đúng chỗ**, ưu tiên sửa cấu trúc (state/render thừa) trước khi đắp cache/memo.

## Nhóm này giải quyết gì

Bốn triệu chứng hiệu năng điển hình, mỗi bài nhắm một nguyên nhân:

1. **Re-render thừa lan tràn** — cha render kéo cả cây con dù props không đổi → React Compiler (và `memo` cho ngoại lệ).
2. **List khổng lồ làm treo trình duyệt** — render 10.000 node DOM, scroll giật, tốn bộ nhớ → virtualization.
3. **Bundle đầu quá lớn** — tải cả app trước khi thấy gì → code-splitting.
4. **Input/search bị lag khi render nặng** — gõ phím bị block bởi filter/sort lớn → scheduling (`useDeferredValue`/`useTransition`).

## Khi nào cần

- App chậm dần khi lớn, Profiler chỉ ra nhiều re-render vô ích → **bài 1**.
- Có list/table/feed **hàng nghìn dòng** (> ~200 dòng) → **bài 2**.
- Bundle JS đầu **> 150–200KB gzip**, hoặc có thư viện nặng ít dùng → **bài 3**.
- Ô search/filter **gõ bị delay**, chuyển tab/view nặng bị đơ → **bài 4**.

**Chống chỉ định**: đừng tối ưu khi chưa đo. List dưới 200 dòng, app nhỏ (< 100KB), render nhẹ (< 50ms) — thêm kỹ thuật chỉ làm phức tạp thêm.

## Các bài con

| # | Bài | Nội dung |
|---|---|---|
| 1 | [1-react-compiler-memo/](1-react-compiler-memo/README.md) | **React Compiler + memo**: Compiler 1.0 tự memoize render (React 19), khi nào vẫn cần `memo`/`useMemo`/`useCallback` thủ công (props ngoài vùng compiler, giá trị đắt, list lớn), `react-compiler-healthcheck`, đo bằng Profiler, rules of React. |
| 2 | [2-virtualization/](2-virtualization/README.md) | **Virtualization (TanStack Virtual)**: windowing list 10k+ dòng, `useVirtualizer` + `getVirtualItems`/`getTotalSize`, `overscan`, row cao động với `measureElement`, `scrollToIndex`. Chỉ render dòng trong viewport + đệm, định vị tuyệt đối theo offset. |
| 3 | [3-code-splitting/](3-code-splitting/README.md) | **Code-splitting**: tách bundle theo route (`lazy`) + vendor (`manualChunks`), prefetch theo hover/link, cân bằng số chunk, đo bằng `vite-bundle-visualizer`, mục tiêu < 200KB gzip. Giữ critical route (login/home) trong main bundle. |
| 4 | [4-deferred-transition/](4-deferred-transition/README.md) | **useDeferredValue + useTransition**: ưu tiên update urgent/non-urgent, input responsive khi filter list lớn, `isPending`, kết hợp memo/virtualization, so sánh với debounce. Nguyên tắc: "input urgent, output deferred". |

## Thứ tự đọc gợi ý

```
1 (memo/compiler) → 3 (tải đúng lượng) → 2 (render đúng số dòng) → 4 (lập lịch khéo)
```

- **1 (React Compiler)**: bật trước — giải quyết phần lớn re-render thừa tự động, và là thứ cần bật ngay khi khởi tạo dự án.
- **3 (code-splitting)**: cải thiện thời gian tải (khác trục với render) — nên làm sớm.
- **2 (virtualization)**: khi có list lớn, giảm số DOM node.
- **4 (deferred/transition)**: tinh chỉnh cảm giác mượt khi render phải chờ.

Đo trước/sau mỗi bước bằng React DevTools Profiler.

## Liên quan tới bài nào khác

- **Bài 1 (Compiler)** dùng chung với `6_dev-tools/2-eslint-flat-hooks` (react-hooks v6 gồm Compiler rules) và `6_dev-tools/4-devtools-perf` (Profiler/badge "compiled").
- **Bài 2 (virtualization)** kết hợp `1_advanced-features/3-store-zustand-tanstack-query` (`useInfiniteQuery` cho feed dài).
- **Bài 3 (code-splitting)** mở rộng `1_advanced-features/1-lazy-dynamic-import` (cơ chế lazy) sang chiến lược chia chunk; liên hệ `5_micro-frontend` (chia chunk theo package).
- **Bài 4 (deferred)** dùng lại ở routing (`1_advanced-features/5`) và nối tiếp `1-react-compiler-memo` (deferred quyết định *khi nào* render, memo quyết định *ai* render).
- **Toàn nhóm** là bản sâu của checklist ở `8_best-practices/4_performance-guide`.

## Mô tả chi tiết từng bài

### 1. React Compiler + memo
Compiler phân tích tĩnh và tự thêm memoization ở bước biên dịch — re-render chỉ khi *thực sự cần*, giảm 70–90% `memo`/`useMemo`/`useCallback` viết tay. Tác giả phải tuân **rules of React** (không mutate props/state); vi phạm → compiler skip component và báo ở build log/eslint. Giữ `memo` thủ công cho ngoại lệ: props từ ngoài vùng compiler, giá trị tính toán rất đắt, list rất lớn. Chạy `react-compiler-healthcheck` trước khi bật cho codebase cũ.

### 2. Virtualization
Vẽ *chỉ* vài chục dòng vừa khớp viewport + `overscan`, định vị tuyệt đối (`translateY(start)`) trên một "canvas" cao bằng `getTotalSize()`. `@tanstack/react-virtual` v3 hỗ trợ row cao động (`measureElement` + `getItemKey`), grid, `scrollToIndex`. Container **bắt buộc** có chiều cao hữu hạn + `overflow: auto`. Kết hợp `useInfiniteQuery` cho feed vô hạn.

### 3. Code-splitting
Tách bundle theo **route** (`lazy`/`route.lazy`) và **vendor** (`manualChunks`) để First Load chỉ chứa phần cần thiết. Tách vendor giúp cache HTTP ổn định (sửa page không làm đổi hash chunk `react-vendor`). Cân bằng số chunk: chunk < 20KB thường không đáng tách, mục tiêu JS đầu < 200KB gzip. Prefetch theo hover/focus để chuyển route "tức thì".

### 4. useDeferredValue + useTransition
Chia update thành *urgent* (gõ phím — tức thì) và *non-urgent* (lọc/render — có thể chờ). `useDeferredValue` tạo "bản sao trễ" cho phần render nặng mà không cần bọc `setState`; `useTransition` bọc `setState` và cho `isPending` để báo nhẹ. Khác debounce: deferred không chờ ngưng gõ và không mất lần gõ cuối. Nguyên tắc: "input urgent, output deferred".

## Sai lầm thường gặp (tổng hợp)

- **Mutate props/state** → Compiler skip component (mất lợi); luôn tạo bản sao, dùng `eslint-plugin-react-compiler` (bài 1).
- **`memo` "bừa" cho component nhẹ** → tốn chi phí so sánh + bộ nhớ; chỉ memo khi Profiler xác nhận (bài 1).
- **Container virtualization không có chiều cao** → `clientHeight = 0`, list trắng; đặt height hữu hạn (bài 2).
- **Lazy hóa cả route trang đầu** → nhiều request nhỏ, LCP kém; giữ critical route trong main bundle (bài 3).
- **Dùng deferred cho chính ô input** → gõ bị trễ; input đọc value gốc, phần nặng mới đọc deferred (bài 4).
- **Tưởng deferred thay virtualization** → nó chỉ hoãn thời điểm render, không giảm DOM node (bài 2 & 4).

## Câu hỏi thường gặp

- **Có cần bỏ memo thủ công khi bật Compiler?** Không bắt buộc; gỡ dần sau khi đo, giữ ngoại lệ thật.
- **Bao nhiêu dòng thì cần virtualize?** Khoảng > 200 dòng; dưới ngưỡng đó thêm chi phí vô ích.
- **Bao nhiêu chunk là hợp lý?** Giữ chunk > ~20KB và tổng < 50 (HTTP/2) để tránh overhead.
- **Deferred khác debounce thế nào?** Debounce chờ ngưng gõ rồi chạy; deferred giữ input nhạy và bắt kịp dần.
- **Khi nào dùng transition thay deferred?** Khi cả một view/query/route đổi (transition có `isPending`), thay vì một giá trị gây render nặng.

## Điểm chung

- Mỗi bài đều có `example.tsx` minh họa benchmark được (render count, DOM nodes, bundle size, delay gõ phím).
- Bộ công cụ 2026: React 19.3 + Compiler 1.0, TanStack Virtual v3, Vite 7 (`manualChunks`, `vite-bundle-visualizer`), React DevTools Profiler.
