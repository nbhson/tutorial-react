# Performance Guide

> Nguồn: https://react.dev/learn/render-and-commit — https://web.dev/vitals/

## Mục tiêu

### 1. Đo trước khi tối ưu: Core Web Vitals (LCP, INP, CLS) + React Profiler

**Vì sao:** tối ưu mù (đoán "chắc do memo") hay sai chỗ (memo chỗ không nóng, bỏ qua ảnh 2MB). Quy trình đúng: đo → nghi ngờ → xác nhận → sửa → đo lại. LCP (< 2.5s, phần tử lớn nhất hiện) cho First Load; INP (< 200ms, phản hồi tương tác) cho gõ/bấm; CLS (< 0.1, layout nhảy) cho ổn định. Profiler (render count/duration từng component) + Performance long task + Lighthouse là 3 thước — chưa có số thì chưa sửa gì.

**Ngưỡng nhớ:** LCP < 2.5s tốt; INP < 200ms tốt (React 19 nhắm); CLS < 0.1 tốt. Vượt là backlog theo thứ tự LCP > INP > CLS (mở không được thì tương tác hay cũng vô nghĩa).

### 2. Giảm re-render đúng cách: Compiler, `memo`, state gần nơi dùng, `useDeferredValue`

**Vì sao 4 thứ này:** Compiler memo tự động (viết trần mà nhanh); `memo` chặn tường minh ngoài vùng compiler; state gần nơi dùng cắt gốc (state root là cả cây vẽ); `deferred` giữ gõ nhạy khi list nặng. Thiếu một là một chiều yếu: Compiler không giảm node DOM, memo không giảm lag gõ, deferred không giảm render thừa.

### 3. Tối ưu bundle (lazy, manualChunks) và assets (ảnh, font) để mở nhanh

**Vì sao:** render nhanh mà bundle 3MB thì LCP vẫn 4s (chưa tải xong lấy gì render). Lazy route + vendor riêng đưa critical < 200KB gzip. Ảnh `avif/webp` + `loading="lazy"` + cỡ trước (chống CLS) + font `swap` + preload — assets hay bị bỏ quên mà chiếm nửa LCP trang media.

## Tổng quan

- Hiệu năng đi từ **đo → nghi ngờ → xác nhận → sửa → đo lại**, không tối ưu bừa. Mỗi sửa phải có số trước/sau (Profiler duration, LCP, bundle KB) — không số là cảm giác.
- React hiện đại nhắm INP < 200ms, LCP < 2.5s, CLS < 0.1. Với React 19 + Compiler, bớt memo tay; tập trung render ít + bundle nhỏ + assets gọn.
- Áp dụng khi app lớn dần, devtools-perf (bài 6/4) chỉ ra render thừa, hoặc trước release quan trọng. App nhỏ đo nhanh một vòng Lighthouse là đủ — đừng over-engineer.

## Khái niệm cốt lõi

### 1. Render & Commit — tính toán (pure) rồi mới chạm DOM

Render = gọi component tính JSX (phải thuần để so sánh); Commit = cập nhật DOM thật. Parent re-render kéo con nếu không memo (con "bị vẽ theo" dù props giống). Hiểu để biết Profiler đỏ ở đâu là render thừa (tính lại vô ích) chứ không phải DOM chậm.

### 2. React Compiler — memo tự động cho code sạch; `memo` tay cho ngoài vùng

Code sạch (không mutate — bài 8/1) thì compiler lo rộng rãi miễn phí. Ngoài vùng (lib cũ, skip) + tính đắt + list lớn thì `memo`/`useMemo` tường minh kèm comment lý do. Đừng tô điểm memo tay khi compiler đã xanh.

### 3. State gần nơi dùng — phạm vi render theo vị trí state

State ở root: đổi là cả cây vẽ. Hạ xuống List: đổi chỉ List vẽ. Colocation (đặt state cạnh nơi đọc) là sửa gốc rẻ nhất — rẻ hơn mọi memo. Nhìn cây mà state nằm quá cao so với nơi đọc là mùi.

```tsx
// ❌ SAI: query ở App — gõ phím vẽ cả App (Sidebar/Header vô can cũng vẽ)
function App() { const [q, setQ] = useState(''); return <><Header /><List q={q} /></>; }
// ✅ ĐÚNG: query ở List — gõ chỉ List vẽ
function App() { return <><Header /><List /></>; }
function List() { const [q, setQ] = useState(''); /* ... */ }
```

### 4. `useDeferredValue`/`useTransition` — input nhạy, nặng hoãn

Gõ nhanh + list 50k: input đọc gốc (urgent), list đọc trễ (non-urgent) — chi tiết xem bài deferred nhóm 3. Không thay virtualization (hoãn thời điểm vs giảm node) — list khổng lồ cần cả hai.

### 5. Bundle — lazy route, vendor riêng, bớt polyfill, visualizer

`React.lazy` + `Suspense` từng route sau login; `manualChunks` vendor nặng riêng; xóa lib không dùng (moment → date-fns là bỏ được cả chunk); visualizer treemap để biết khối nào phình. Critical < 200KB gzip là đích.

### 6. Assets — ảnh `avif/webp` + lazy + cỡ trước; font `swap` + preload

Ảnh dưới fold `loading="lazy"` (không tải lúc đầu); `width`/`height` hoặc `aspect-ratio` giữ chỗ (không CLS khi ảnh về); `<picture>` multi-format (avif → webp → jpeg). Font `font-display: swap` (chữ hiện ngay font hệ thống, font đẹp về sau) + `preload` font heading. Ảnh 2MB không nén là LCP 4s dù JS đã tối ưu.

### 7. Data — `staleTime`, pagination/infinite, Query cache

`staleTime` theo tần suất đổi (tĩnh `Infinity`, giá `0` + interval). Tải hết 10k thì pagination/infinite + virtualize — không tải hết rồi render hết. Query dedupe + cache để 2 component chung key chỉ 1 request.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Đo: Lighthouse (LCP/CLS) + Profiler (re-render) + Performance (long task)

Lighthouse/PageSpeed cho vitals; DevTools Profiler record lúc gõ/chuyển (render count/duration); Performance cho long task đỏ (bài 6/4). Lưu baseline (số + screenshot) vào tài liệu.

### Bước 2. Sửa re-render: Compiler + memo đúng chỗ + hạ state + deferred

Bật compiler, memo chỗ Profiler chỉ (list lớn/đắt), hạ state thừa ở root, deferred cho list theo input. Mỗi sửa đo lại một lần — không sửa dồn 5 thứ rồi đo (không biết cái nào có tác dụng).

### Bước 3. Sửa bundle: lazy route + vendor + xóa lib thừa

Route sau login lazy hết; vendor nặng riêng; lib không dùng xóa. Budget CI (`size-limit`) để tăng là đỏ.

### Bước 4. Sửa assets: nén + lazy + preload + swap

Ảnh dưới fold lazy, cỡ trước, format mới. Font heading preload + swap. Đo LCP trước/sau (assets hay ăn nửa LCP).

### Bước 5. Sửa data: staleTime + phân trang + cache

Tĩnh hiếm đổi `staleTime` dài; realtime `setQueryData` từ socket thay polling; list lớn infinite + virtual. Không `refetchOnWindowFocus` khi không cần (đỡ request thừa).

### Bước 6. Đo lại, lưu trước/sau

LCP/INP/CLS + Profiler + bundle KB. Cải thiện < 10% thì revert (phức tạp không xứng). Ghi vào release note để lần sau có mốc.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Checklist thu nhỏ: memo item + deferred query + useMemo lọc — 3 lớp re-render trong một file
import { memo, useDeferredValue, useMemo, useState } from 'react';

// Item memo: chỉ render lại khi `v` đổi — list 100+ không phải render theo từng lần gõ
// Vì sao memo ở đây: FastFilter re-render mỗi phím; không memo thì 100 Item vẽ lại dù chữ không đổi
export const Item = memo(function Item({ v }: { v: string }) {
  return <li>{v}</li>;
});

export function FastFilter({ data }: { data: string[] }) {
  const [q, setQ] = useState('');
  // Giữ ô input phản hồi ngay (đọc q gốc); kết quả lọc hoãn theo dq (đọc trễ) khi gõ nhanh
  // Vì sao deferred: filter hàng nghìn + render là non-urgent — hoãn để gõ không lag (INP thấp)
  const dq = useDeferredValue(q);

  // useMemo: tránh tính lại filter khi component render vì lý do khác (cha vẽ lại) mà dq chưa đổi
  const visible = useMemo(
    () => data.filter((d) => d.toLowerCase().includes(dq.toLowerCase())).slice(0, 100),
    [data, dq], // deps data + trễ — q gốc đổi mà dq chưa kịp thì không tính thừa
  );

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc nhanh…" />
      <ul>
        {visible.map((v) => (
          <Item key={v} v={v} /> // key ổn định + memo → Item nào v không đổi thì bỏ qua
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// Lazy route — mirror từ README gốc: bundle từng trang riêng, tải khi truy cập
import { lazy, Suspense } from 'react';

// Vì sao lazy ở đây: Checkout/Orders nặng, ít vào cùng lúc — First Load không gánh cả hai
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const OrdersPage = lazy(() => import('./pages/Orders'));

// Trong router: bọc Suspense, fallback skeleton nhẹ (không spinner nhỏ gây nhảy layout)
export function RouteFallback() {
  return (
    <Suspense fallback={<div>Đang tải trang…</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
```

```html
<!-- Ảnh: định cỡ trước (chống CLS) + lazy-load khi vào viewport (mirror từ README gốc) -->
<!-- Vì sao 3 thuộc tính: width/height giữ chỗ (không nhảy khi ảnh về), lazy đỡ LCP đầu, alt cho a11y -->
<img
  src="/img/product.webp"
  width="400"
  height="300"
  loading="lazy"
  alt="Ảnh sản phẩm"
/>
```

## Giải thích từng phần

### `useDeferredValue(q)` — input ngay, list hoãn, không block gõ

Gõ 5 phím mà list mới bắt kịp 2 lần — đúng thiết kế (INP thấp). Đảo (input đọc `dq`) là gõ lag — kiểm tra mỗi `value` đang đọc biến nào.

### `useMemo` + `slice(0, 100)` — bớt tính + bớt node

Không memo là render nào cũng filter lại; không slice là render 10k node (deferred không cứu node). 100 đầu đủ cho tìm kiếm nhanh; cần hết thì virtualize + infinite.

### `memo(Item)` — parent vẽ không kéo con không đổi

Mỗi phím parent vẽ, Item giữ `v` bỏ qua. `v` là string (so `Object.is` rẻ) nên memo hiệu quả; object mới mỗi lần thì phải ổn định reference trước.

### `React.lazy` từng route — LCP cải thiện ở route đầu

Critical chỉ shell + route đầu; route nặng tải khi vào. Giữ login/home tĩnh (LCP không chờ network).

### `width/height` + `loading="lazy"` — không CLS + đỡ LCP

Không cỡ: ảnh về muộn đẩy chữ nhảy (CLS cao). Dưới fold mà không lazy: tải lúc đầu, LCP chậm oan.

## Lỗi thường gặp / Chống chỉ định

### 1. Memo bừa/`useCallback` vô nghĩa → phức tạp không nhanh

Chỉ memo sau Profiler xác nhận (count cao + props không đổi). Component nhẹ memo là lỗ (so sánh đắt hơn vẽ).

### 2. `useMemo` cả cây cha deps rộng → vẫn chạy lại

Hạ state xuống gần nơi dùng thay vì memo cả cây. Memo không sửa được state đặt sai chỗ.

### 3. Lazy mọi nơi → request nhỏ tràn lan, TTFB tệ

Lazy route lớn, không lazy icon/component nhỏ (< 20KB). Đếm chunk sau tách (< 50, mỗi ≥ 20KB).

### 4. Quên `width/height` → CLS cao

Luôn cỡ trước (hoặc `aspect-ratio`). Ảnh trong virtual row cũng chừa chỗ để đo đúng.

### 5. Retry/refetch liên tục → tải thừa

`staleTime` hợp lý + tắt `refetchOnWindowFocus` khi không cần. Socket đẩy thì `setQueryData`, không polling 2s.

## Best practices / Mẹo

### Đo trước; LCP > INP > CLS; Compiler + sạch là memo miễn phí; font swap + picture; budget CI

Chưa số chưa sửa. Mở được (LCP) trước, bấm mượt (INP) sau, ổn định (CLS) cuối. Compiler + code sạch (bài 8/1) là memo rộng rãi — đừng tô memo tay. Font `swap` + preload heading; ảnh `<picture>` đa format. `size-limit` trong CI để bundle tăng là đỏ.

## Bài tập nhỏ

1. `data` 10.000 chuỗi, Profiler record lúc gõ vào `FastFilter` — ghi duration + count bản thô (không memo/deferred).
2. Thêm memo item — đo lại, tính % giảm render.
3. Thêm `useDeferredValue` — đo lại, tính % giảm INP/delay gõ.
4. So 3 bản (thô/memo/memo+deferred): bảng số + kết luận giữ bản nào + vì sao. Kèm Network (bundle) + Lighthouse (LCP) nếu có.

## Reference

- [React — Render and Commit](https://react.dev/learn/render-and-commit)
- [Core Web Vitals (web.dev)](https://web.dev/vitals/)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Web Performance Guide (MDN)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance)
