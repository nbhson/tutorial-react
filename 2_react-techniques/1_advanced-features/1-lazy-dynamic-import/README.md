# Lazy + Dynamic Import (React 19)

> Nguồn: https://react.dev/reference/react/lazy — https://react.dev/reference/react/Suspense

## Mục tiêu
- Giảm kích thước bundle ban đầu (First Load) bằng cách tách code thành các chunk nhỏ.
- Chỉ tải component/thư viện nặng khi thực sự cần (khi route được mở, khi user bấm nút).
- Cải thiện LCP/TTI: màn hình đầu chỉ gồm code cốt lõi, phần còn lại tải song song/trễ.

## Tổng quan
Bài này giải quyết vấn đề **bundle phình to**: một SPA thường nhét toàn bộ page + thư viện nặng (chart, editor, PDF…) vào một file JS duy nhất → người dùng phải tải những thứ họ không dùng. Kỹ thuật gồm hai nửa bổ trợ:

- **Route-level lazy**: mỗi route là một chunk, chỉ tải khi user điều hướng tới (phù hợp app trung bình/lớn).
- **Conditional `import()`**: tải component nặng trong event handler (mở modal, bấm "Chỉnh sửa") — thứ chưa chắc user sẽ dùng (phù hợp feature nhỏ nhưng nặng).

Áp dụng khi: bundle JS đầu > 150–200KB gzip, hoặc có module nặng chỉ dùng ở một vài màn hình.

## Khái niệm cốt lõi
- **`import()` động** là một *dynamic import* chuẩn ES: nó trả về `Promise<module>`. Vite/Rollup nhìn thấy lời gọi này và tách module đó thành chunk riêng. Chunk chỉ được tải qua network khi promise được chạy.
- **`React.lazy(factory)`** nhận một hàm trả về promise của module, rồi trả về một component "không có sẵn nội dung". `lazy` **chỉ hoạt động với default export** — với named export phải bọc lại: `import('./X').then(m => ({ default: m.X }))`.
- **`Suspense`** là "bộ điều phối chờ đợi": khi con của nó chưa sẵn sàng (component lazy đang tải), React *suspend* (tạm dừng) cây render và vẽ `fallback`. Khi promise resolve, React render lại với nội dung thật. Bắt buộc phải có `Suspense` quanh component lazy, nếu không React báo lỗi runtime.
- **Link prefetch**: trình duyệt có thể dự đoán và tải nguồn sắp dùng qua `<link rel="modulepreload">`; React Router v7 cũng cho phép tải sẵn route data + chunk khi hover vào link (xem bài 3-code-splitting).
- **Một module = một lần tải**: `import()` trả về cùng một promise/module đã cache cho mọi lời gọi sau — lazy component tải lần đầu, các lần mount sau dùng ngay. Nhờ vậy không cần tự cache bằng tay.
- **Suspense lồng nhau**: `Suspense` gần nhất bao component sẽ bắt fallback của nó; nhiều tầng Suspense cho phép skeleton chi tiết (outer cho layout, inner cho widget) — React chỉ vẽ đúng fallback bị ảnh hưởng.
- **SSR/hydration**: với framework hỗ trợ streaming (React 19), lazy gặp lúc server-render có thể cần `lazy` kèm `preload`/`hydrate`; SPA thuần Vite không gặp vấn đề này.

## Luồng hoạt động / Cách áp dụng
1. Xác định "món nặng": đo bằng bundle visualizer, chọn page/thư viện chiếm nhiều KB.
2. Chuyển import tĩnh thành `lazy(() => import('./X'))` và bọc trong `<Suspense fallback={...}>`.
3. Chạy build: kiểm tra output gồm nhiều chunk `.js`, `import()` xuất hiện dưới dạng `Promise` (không bị gộp vào main bundle).
4. Bọc `ErrorBoundary` quanh vùng lazy để xử lý cảnh mạng chậm → chunk tải thất bại.
5. Nếu cần tương tác điều kiện (modal/editor), gọi `import()` ngay trong event handler thay vì dùng `lazy`.

## Ví dụ chi tiết
```tsx
import { lazy, Suspense, useState } from 'react';

// lazy() nhận factory trả về Promise của module.
// HeavyChart là named export nên phải map sang { default: m.HeavyChart }.
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);

export function LazyDemo() {
  // show quyết định component có được mount không
  const [show, setShow] = useState(false);
  return (
    <div>
      {/* Chỉ khi bấm nút, lazy component mới bắt đầu tải chunk */}
      <button onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        // Suspense bắt buộc: vẽ fallback trong lúc chunk đang tải
        <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

Route-level lazy với React Router v7:
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
// router tải chunk Dashboard ngay khi user điều hướng tới /dashboard
```

## Giải thích từng phần
- `const show = useState(false)` → **điểm kích hoạt tải**: chunk biểu đồ không hề được nhắc tới cho tới khi `show === true`. Nhờ đó bundle đầu không chứa chart library.
- `.then((m) => ({ default: m.HeavyChart }))` → **chuyển named export sang default**: đây là cách duy nhất để `lazy` hiểu, vì nó chỉ đọc `module.default`.
- `<Suspense fallback={<p>…</p>}>` → giao diện "đang tải": với route-level lazy bạn có thể đặt một `<Suspense>` duy nhất bọc `<Outlet/>` để dùng chung skeleton toàn trang.
- `{show && ...}` → React vẫn giữ component trong cây JSX trước khi bấm nút; khi bấm, vòng đời của lazy component mới bắt đầu (tải → suspend → render).

## So sánh (nếu có)
- **`React.lazy` + `Suspense` vs gọi `import()` thủ công + `useState`**: `lazy` giữ trạng thái "đã tải" của module, tránh tải lại khi remount, và được vẽ qua cơ chế Suspense nhất quán. `import()` thủ công linh hoạt hơn (ví dụ quyết định runtime), nhưng phải tự quản lifecycle, lỗi, và cache bằng tay.
- **Route-level vs component-level splitting**: route-level tách theo hướng điều hướng (1 chunk/page — thường đủ tốt); component-level tinh chỉnh hơn cho phần nặng nằm trong page (chart, editor). Thực tế dùng cả hai.

## Lỗi thường gặp / Chống chỉ định
- **Quên `<Suspense>`** → React ném lỗi "A component suspended while responding to synchronous input". Fix: luôn bọc fallback, hoặc đặt Suspense cấp route.
- **`lazy` với named export để nguyên** → chunk tải xong vẫn render rỗng/undefined. Fix: wrapper `.then(m => ({ default: m.X }))`.
- **Không bọc ErrorBoundary** → mạng lỗi khi tải chunk sẽ crash cả app. Fix: `ErrorBoundary` quanh vùng lazy với nút "Thử lại".
- **Split quá nhỏ / quá nhiều chunk** → nhiều request nhỏ làm chậm hơn một request vừa (HTTP overhead + latency). Fix: chỉ split theo route/vendor lớn, đặt mục tiêu chunk > 20KB.
- **Chống chỉ định**: app nhỏ (< 50KB gzip) hoặc tất cả route dùng chung 1 thư viện — lazy lúc này chỉ thêm phức tạp mà không lời. Cũng không dùng `lazy` cho module có side-effect khi import (thực thi ngay lập tức khi bundle được yêu cầu).

## Câu hỏi thường gặp
- **Khác nhau giữa `React.lazy` và gọi `import()` trực tiếp?** `lazy` trả về một component và tích hợp sẵn với Suspense; `import()` trả promise của module thô, bạn tự quản lý state, lỗi và cache.
- **Chunk tải thất bại vì mạng thì sao?** Bọc `ErrorBoundary` quanh vùng lazy; nút "Thử lại" gọi lại `import()` (hoặc reload) — module có thể tải lại thành công khi mạng hồi.
- **Có nên lazy hóa mọi component?** Không. Chỉ lazy route lớn và module nặng dùng không thường xuyên; component nhỏ lazy hóa chỉ tăng request và phức tạp.
- **Lazy ảnh hưởng SEO không?** Với SPA client-render thì nội dung phụ thuộc JS dù lazy hay không; với SSR/streaming, React 19 xử lý lazy trong luồng render server — cần cấu hình `preload` đúng.
- **Làm sao biết chunk đã tách đúng?** Chạy build, xem output có nhiều file `.js`; trong bundle analyzer, module nặng nằm ở chunk riêng chứ không gộp vào `index`.

## Ghi chú 2026
- React 19.3 ổn định cơ chế Suspense + streaming SSR; `lazy` hoạt động tốt trong RSC khi kết hợp client boundary.
- Ưu tiên `route.lazy` của React Router v7 để chunk mang cả loader, giảm một tầng bọc.
- Với Vite 7, `import()` không còn sinh ra chunk quá nhỏ nhờ heuristics gom nhóm; vẫn nên kiểm tra bằng `vite-bundle-visualizer`.

## Best practices / Mẹo
- Luôn đặt `Suspense` **trên** vùng lazy, không đặt fallback ở từng component con nếu chúng dùng chung trạng thái loading.
- Kết hợp **prefetch**: `onMouseEnter`/`onFocus` link gọi `import()` trước để người dùng không bao giờ thấy fallback khi bấm.
- Với Vite, đặt `build.chunkSizeWarningLimit` hợp lý và kiểm tra bằng `vite-bundle-visualizer`.
- Giữ `lazy` factory ổn định: không tạo `lazy` bên trong render (mỗi lần render lại reset toàn bộ trạng thái).
- Đặt `preload` cho route sắp vào nhìn thấy (viewport gần), ví dụ qua `IntersectionObserver`.
- Kết hợp **`lazy` + ErrorBoundary + "Thử lại"**: nút retry gọi lại `import()` (module lỗi lần đầu vẫn có thể tải lại thành công nếu mạng đã hồi).
- Ở tầng route, đặt một `<Suspense>` chung quanh `<Outlet/>` với skeleton toàn trang, và Suspense nhỏ hơn cho widget nặng — tránh "trắng toàn màn hình".
- Kết hợp `startTransition` khi điều hướng để fallback không chớp giữa lúc tải chunk.
- Ở route-level, ưu tiên `route.lazy` để gộp loader + component trong cùng chunk.
- Kiểm tra chunk sau mỗi build trong CI để phát hiện module lọt nhầm vào main bundle.
- Đặt `Suspense` cấp route với skeleton đầy đủ thay vì spinner nhỏ giữa trang.
- Tránh lazy cho component phụ thuộc state khởi tạo — remount dễ làm mất state.
- Ghi chú lý do lazy trong comment để người đọc sau không gỡ nhầm.
- Kiểm tra chunk không bị gộp lại khi project có nhiều entrypoint.
- Ghi lại danh sách route lazy (và route giữ trong main bundle) trong README dự án.
- Tránh lazy cho component màn hình đầu — giữ thẳng trong main bundle.

## Bài tập nhỏ
Tạo app có 2 route: `/home` (nhẹ) và `/reports` (nặng, giả lập bằng `<HeavyTable/>` 10.000 dòng). Dùng `lazy` cho `ReportsPage`, bọc `Suspense`, thêm nút "Thử lại" qua ErrorBoundary nếu import thất bại. Kiểm tra tab Network: chunk `reports` chỉ xuất hiện khi điều hướng tới `/reports`.

## Reference
- [React.lazy](https://react.dev/reference/react/lazy)
- [Suspense](https://react.dev/reference/react/Suspense)
- [React Router — Lazy Loading](https://reactrouter.com/how-to/lazy-loading)
- [Vite — Code Splitting](https://vite.dev/guide/features.html#manual-chunks)