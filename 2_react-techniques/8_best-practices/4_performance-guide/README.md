# Performance Guide

> Nguồn: https://react.dev/learn/render-and-commit — https://web.dev/vitals/

## Mục tiêu
- Đo trước khi tối ưu: Core Web Vitals (LCP, INP, CLS) + React Profiler.
- Giảm re-render đúng cách: Compiler, `memo`, state gần nơi dùng, `useDeferredValue`.
- Tối ưu bundle (lazy, manualChunks) và assets (ảnh, font) để trang mở nhanh.

## Tổng quan
- Hiệu năng phải đi từ **đo → nghi ngờ → xác nhận → sửa → đo lại**, không tối ưu bừa.
- React hiện đại nhắm INP < 200ms (phản hồi tương tác), LCP < 2.5s, CLS < 0.1.
- Với React 19 + Compiler, bớt việc memo tay; tập trung vào render ít + bundle nhỏ + assets.
- Áp dụng khi: ứng dụng lớn dần, devtools-perf (bài 6/4) chỉ ra re-render thừa, hoặc trước release quan trọng.

## Khái niệm cốt lõi
- **Render & Commit**: render = tính toán component (pure để so sánh); commit = cập nhật DOM. Re-render **của parent** thường kéo theo con nếu không memo.
- **React Compiler**: tự memoize theo giá trị — điều kiện là code "sạch" (không mutate — bài 8/1); `memo`/`useMemo` tay để dành chỗ không thuộc phạm vi Compiler.
- **State ảnh hưởng phạm vi render**: đặt state càng gần nơi render càng tốt; state ở root làm cả cây render.
- **`useDeferredValue`/`useTransition`**: giữ input nhạy (gõ nhanh) nhưng hoãn phần nặng (list lọc) — tránh chặn main thread.
- **Bundle**: lazy route (React.lazy + Suspense), tách vendor (manualChunks), giảm polyfill, xem visualizer.
- **Assets**: ảnh `avif/webp` + `loading="lazy"` + kích thước/`aspect-ratio` (chống CLS); font `display: swap` + preload.
- **Data**: `staleTime` hợp lý, pagination/infinite thay vì tải hết, cache bằng TanStack Query.

## Luồng hoạt động / Cách áp dụng
1. Đo: Lighthouse/PageSpeed cho LCP/CLS; React DevTools Profiler cho re-render; Chrome Performance cho long task (bài 6/4).
2. Sửa re-render: Compiler + `memo` đúng chỗ, hạ state xuống gần nơi dùng, `useDeferredValue` cho list lớn.
3. Sửa bundle: `React.lazy` cho route, `manualChunks` cho vendor, xóa thư viện không dùng.
4. Sửa assets: nén ảnh, lazy-load (ảnh dưới fold), preload font then swap.
5. Sửa data: `staleTime` theo tần suất thay đổi, phân trang/infinite.
6. Đo lại xác nhận cải thiện; lưu kết quả trước/sau.

## Ví dụ chi tiết
```tsx
// example.tsx — checklist thu nhỏ: memo item + deferred query + useMemo lọc
import { memo, useDeferredValue, useMemo, useState } from 'react';

// Item memo: chỉ render lại khi `v` đổi — list 100+ không phải render theo từng lần gõ
export const Item = memo(function Item({ v }: { v: string }) {
  return <li>{v}</li>;
});

export function FastFilter({ data }: { data: string[] }) {
  const [q, setQ] = useState('');
  // Giữ ô input phản hồi ngay; kết quả lọc được hoãn (bkg) khi gõ nhanh
  const dq = useDeferredValue(q);

  // useMemo: tránh tính lại filter khi component render vì lý do khác
  const visible = useMemo(
    () => data.filter((d) => d.toLowerCase().includes(dq.toLowerCase())).slice(0, 100),
    [data, dq],
  );

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc nhanh…" />
      <ul>
        {visible.map((v) => (
          <Item key={v} v={v} />
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// Lazy route — bundle từng trang riêng, tải khi truy cập
import { lazy, Suspense } from 'react';

const CheckoutPage = lazy(() => import('./pages/Checkout'));
const OrdersPage = lazy(() => import('./pages/Orders'));

// Trong router: bọc Suspense, fallback bằng skeleton nhẹ
export function RouteFallback() {
  return (
    <Suspense fallback={<div>Đang tải trang…</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
```

```html
<!-- Ảnh: định cỡ trước (chống CLS) + lazy-load khi vào viewport -->
<img
  src="/img/product.webp"
  width="400"
  height="300"
  loading="lazy"
  alt="Ảnh sản phẩm"
/>
```

## Giải thích từng phần
- `useDeferredValue(q)`: input đổi ngay, list lọc cập nhật "thừa thời gian" — không block typing.
- `useMemo` + `slice(0, 100)`: chỉ giữ 100 item đầu — render ít, list vẫn đủ để tìm.
- `memo` trên `Item`: mỗi lần gõ, parent re-render nhưng Item giữ nguyên nếu `v` không đổi.
- `React.lazy` từng route: chia bundle theo điểm vào — LCP cải thiện rõ ở route đầu.
- `width`/`height` + `loading="lazy"`: giữ chỗ ảnh (không CLS) và tải trễ ảnh dưới màn hình.

## Lỗi thường gặp / Chống chỉ định
- **Memo bừa / `useCallback` vô nghĩa**: phức tạp code, không tăng hiệu năng → chỉ memo sau khi Profiler xác nhận.
- **`useMemo` cho toàn cây cha** với deps rộng: vẫn chạy lại → đưa state xuống gần nơi dùng.
- **Lazy-load toàn bộ cả mọi nơi**: quá tải request nhỏ, TTFB tệ → lazy route lớn, không lazy icon/component nhỏ.
- **Quên `width/height` trên ảnh**: CLS cao khi ảnh về muộn → luôn khai kích thước (hoặc `aspect-ratio`).
- **Retry/refetch liên tục từ query**: thêm tải → `staleTime` hợp lý + không `refetchOnWindowFocus` khi không cần.

## Best practices / Mẹo
- Quy tắc "đo trước": nếu chưa có Profiler/Lighthouse, chưa sửa gì.
- Ưu tiên theo mức ảnh hưởng: LCP (nặng render đầu) > INP (tương tác) > CLS (layout ổn định).
- React Compiler + code sạch (bài 8/1) là "memo rộng rãi" miễn phí — đừng tô điểm bằng `memo` tay khi đã bật Compiler.
- Font: `font-display: swap` + preload font cho heading; ảnh dùng thẻ `<picture>` multi-format.
- Giữ budget: ghi dung lượng bundle trong CI (`size-limit`) để chặn tăng đột biến.

## Bài tập nhỏ
Dùng `data` 10.000 chuỗi, mở React Profiler ghi thời gian render khi gõ vào `FastFilter`. Thử 3 biến thể (không memo, có memo item, thêm useDeferredValue) — ghi lại thời gian mỗi bản và phần trăm cải thiện.

## Reference
- [React — Render and Commit](https://react.dev/learn/render-and-commit)
- [Core Web Vitals (web.dev)](https://web.dev/vitals/)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Web Performance Guide (MDN)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance)