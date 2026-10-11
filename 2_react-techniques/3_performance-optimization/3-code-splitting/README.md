# Code-Splitting

> Nguồn: https://react.dev/reference/react/lazy — https://vite.dev/guide/features.html#manual-chunks

## Mục tiêu
- Chia bundle JS thành nhiều **chunk** để First Load chỉ tải phần cần thiết nhất.
- Tách vendor nặng (chart, editor, PDF) thành chunk riêng — không kéo theo màn hình đầu.
- Tận dụng prefetch khi user sắp click để trải nghiệm "tức thì".

## Tổng quan
Một SPA gộp mọi thứ vào một file JS duy nhất: user mở trang đăng nhập cũng phải tải 3MB code dashboard chưa dùng. **Code-splitting** cắt bundle theo ranh giới tự nhiên: **route** (mỗi route một chunk) và **vendor** (thư viện lớn đứng riêng) — kết quả là file đầu chỉ ~100–200KB gzip, phần còn lại tải on-demand đúng lúc. Ở tầng cơ chế, `import()` động và `React.lazy` đã có (xem bài 1-lazy-dynamic-import); bài này nhấn khía cạnh *chiến lược chia*: chia ở đâu, ai tách vendor, prefetch như thế nào, đo bằng gì.

## Khái niệm cốt lõi
- **Route-based splitting**: `const Page = lazy(() => import('./pages/Page'))` — đây là mức chia *prima facie*: mỗi route độc lập tải khi điều hướng. Với React Router v7 có `route.lazy` cho phép trả object `{ Component, loader }` gọn hơn.
- **Vendor/chunk splitting**: Vite/Rollup đã tách `react`/`react-dom` thường không; `build.rollupOptions.output.manualChunks` cho ta *gộp thủ công* các thư viện theo nhóm (`chart-vendor`, `editor-vendor`) để: (1) thư viện nặng không nằm lẫn page chunk, (2) đổi code page không làm mất cache của chunk vendor (immutable URL).
- **Prefetch**: khi user **hover/focus** link, ta gọi trước `import('./page')` — chunk đã vào cache cho lúc click; React Router `Link prefetch` làm sẵn, hoặc tự làm qua `onMouseEnter`. Không phải lúc nào cũng cần (chunk < 50KB thường tải nhanh khi điều hướng).
- **Cảnh báo chunk/サイズ**: mỗi request có overhead (~30–80ms, kèm handshake nếu không HTTP/2); chia 200 chunk 5KB sẽ chậm hơn 20 chunk 50KB. Cân bằng bằng threshold: chunk > ~20KB mới đáng tách.
- **Đo lường**: `vite-bundle-visualizer` / `rollup-plugin-visualizer` xem tree-map bundle; DevTools Network cột “Size / Transfer Size”; mục tiêu JS đầu < 200KB gzip (với app trung bình).

## Luồng hoạt động / Cách áp dụng
1. Chạy build + visualizer → tìm 3 thứ to nhất (vendor lớn, page ít dùng, module phình).
2. Lazy hóa mọi route không có trong "trang đầu trọng yếu": `lazy(() => import('./pages/X'))` + `Suspense`.
3. Tách thư viện nặng dùng rời rạc (editor, chart, PDF viewer) thành `manualChunks` riêng.
4. Thêm prefetch cho link trọng yếu (hover/focus). Kiểm tra Network: hover → chunk xuất hiện trước khi click.
5. Re-measure: `Total Size`, tổng số chunk, và First Load (gzip).

## Ví dụ chi tiết
```tsx
// Route lazy (React Router v7) — mỗi page một chunk, tải khi điều hướng
import { lazy, Suspense } from 'react';

// import động: file ngoài main bundle, tải khi cần
const Analytics = lazy(() => import('./AnalyticsPage'));
const Editor = lazy(() => import('./EditorPage'));

export function Routes({ page }: { page: 'analytics' | 'editor' }) {
  return (
    // Suspense bọc cả 2: fallback giống nhau cho toàn vùng route
    <Suspense fallback={<p>Đang tải trang…</p>}>
      {/* chỉ mount 1 page tương ứng — chunk kia không hề tải */}
      {page === 'analytics' ? <Analytics /> : <Editor />}
    </Suspense>
  );
}
```

```ts
// vite.config.ts — tách vendor theo nhóm
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // gộp react + router vào 1 chunk ổn định (đổi code không đổi hash)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // chart riêng: chỉ route /analytics cần mới tải — không kéo 500KB vào đầu
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
};
```

## Giải thích từng phần
- `lazy(() => import('./AnalyticsPage'))` — Rollup nhìn thấy `import()` tĩnh-path trong factory và tách file đó thành chunk; `Suspense` giữ UX "đang tải" trong lúc chunk về.
- React Router v7 tiến xa hơn: `route.lazy = () => import('./pages/analytics')` để chunk mang luôn `loader`+`Component` — giảm một bước bọc.
- `manualChunks` gom vendor: lợi ích kép — `react-vendor` gần như không đổi nên hash URL giữ nguyên → trình duyệt dùng cache HTTP; `chart-vendor` tách khỏi page code để sửa Analytics không invalidation cả chart.
- Tách `Suspense` chỉ cho page controller; các thành phần nhỏ nằm trong page chunk đã được lazy luôn (không cần thêm Suspense nữa).
- Cân nhắc **manualChunks quá tay**: nếu 100KB chart mà chỉ 1 route dùng — đúng; nếu thư viện 5KB mọi route dùng — đừng tách, phí request.

## So sánh (nếu có)
- **One-bundle vs multi-chunk**: one file — ít request, đơn giản, nhưng First Load dài; multi-chunk — First Load nhanh, cache tốt hơn, nhưng cần kiểm soát số/hạn mức chunk và xử lý loading giữa middle (Suspense/loader state).
- **manualChunks (gộp thủ công) vs để Rollup tự chia**: tự chia thường theo entry/dynamic import — đủ cho app vừa; gộp tay cần khi muốn ổn định hash vendor (cache) hoặc nhóm đúng miền (chart-vendor). Có thể kết hợp: tự chia page + gộp tay vendor lớn.
- **Prefetch toàn bộ vs prefetch có điều kiện**: prefetch hết link tiêu tốn băng thông user trên data plan; chọn prefetch route "kế đến khả năng cao" (bước flow chính), hoặc dùng `onFocus`/`onMouseEnter` thay vì preload ngay.

## Lỗi thường gặp / Chống chỉ định
- **Lazy hóa tất cả route, kể cả route nhỏ /ln đầu** → trang đầu bị nhiều request nhỏ, LCP kém. Fix: giữ critical route (login/home) code thẳng trong main bundle; lazy cho route sau login.
- **`manualChunks` chia quá nhỏ** (chunk < 10KB) → nhiều request phí. Fix: gom theo group đạt ≥ 20KB; dùng visualizer xác nhận.
- **Quên cache-busting / không tách vendor** → mỗi lần sửa page, cả bundle (gồm react-dom) đổi hash → user tải lại 3MB vô ích. Fix: tách vendor + đặt tham số đủ (Rollup tự hash; `manualChunks` để nhóm ổn định).
- **Tách chunk để token/fonts nạp sai scope** (asset trong chunk bị tải khác) → đừng nhồi asset path vào manualChunks; dùng public assets riêng.
- **Chống chỉ định**: app di động mạng chậm nên tránh *quá nhiều* chunk (mỗi chunk 1 round-trip); app rất nhỏ (< 100KB) — code-splitting chỉ thêm phức tạp; hãy đo First Load trước rồi quyết định.

## Câu hỏi thường gặp
- **Bao nhiêu chunk là hợp lý?** Không có con số tuyệt đối; giữ chunk trên ~20KB và tổng số chunk vừa phải (< 50 với HTTP/2) để tránh overhead request.
- **Lazy có ảnh hưởng SEO không?** Với SSR/streaming, chunk vẫn được render server-side đúng; với SPA thuần, SEO phụ thuộc JS bất kể lazy.
- **`manualChunks` khác dynamic import?** Dynamic import tách tự động theo path (`import()`); `manualChunks` gộp thủ công theo nhóm vendor để ổn định cache.
- **Prefetch có tốn data của user?** Có — chỉ prefetch route khả năng cao sẽ vào, hoặc dùng `onMouseEnter`/`onFocus` để tải đúng lúc gần click.
- **Làm sao biết chunk nào nặng?** Dùng `vite-bundle-visualizer` hoặc `rollup-plugin-visualizer` xem tree-map; đối chiếu Network cột Transfer Size.

## Ghi chú 2026
- Vite 7 tối ưu `manualChunks` và cảnh báo chunk lớn; dùng `build.chunkSizeWarningLimit` hợp lý.
- React Router v7 `route.lazy` gộp loader + Component vào một chunk — gọn hơn bọc tay.
- HTTP/2 và CDN edge khiến nhiều chunk nhỏ ít tốn kém hơn trước, nhưng vẫn nên tránh phân mảnh quá mức.

## Best practices / Mẹo
- Đặt mục tiêu đo được: JS critical < 200KB gzip, tổng chunk trên 20KB, số chunk < 50 (HTTP/2).
- Dùng `route.lazy` của React Router v7 và `Link prefetch="viewport"` cho route trọng yếu.
- Maintain `manualChunks` theo "nhóm thư viện": `react-vendor`, `ui-vendor`, thư viện nặng riêng; chia theo feature-chunk khi một route độc lập hẳn.
- Kết hợp với **lazy + ErrorBoundary** (bài 1) để bắt lỗi chunk tải thất bại (mạng kém) và "Thử lại".
- Đo cả **First Load vs Route Switch**: khí split tốt, route switch cũng không bị chờ network chậm vì prefetch đã làm trước.
- Đặt `output.assetFileNames`/`chunkFileNames` có hash để tận dụng cache HTTP tối đa.
- Với monorepo/micro-frontend, chia chunk theo package và dùng Module Federation cho remote.
- Dùng Lighthouse mục "Reduce unused JavaScript" để xác nhận split thực sự có lợi.
- Kiểm tra điều kiện lazy qua feature flag (`import.meta.env.PROD`) nếu module chỉ có trong production.
- Giữ route đầu tiên (landing/login) không lazy để LCP không phải chờ network.
- Trên CDN, bật `modulepreload` cho chunk chắc chắn dùng ngay.
- Ưu tiên thay thế thư viện nặng (moment → date-fns) trước khi tách chunk — đôi khi bỏ được cả chunk.
- Theo dõi kích thước bundle trong CI (bundle budget) để bắt hồi quy sớm.
- Bật tree-shaking (`sideEffects: false`) và xoá dead export trước khi tối ưu chia chunk.
- Kiểm tra chunk chung (`common`) không bị lặp vendor giữa các entry.
- Với i18n, tách từng locale thành chunk riêng và lazy theo ngôn ngữ.
- Cấu hình `build.modulePreload` để trình duyệt tải trước chunk phụ thuộc.

## Bài tập nhỏ
App có 4 route + recharts (chart) + Monaco editor (nặng). Refactor: lazy từng route; `manualChunks` tách `react-vendor`, `chart-vendor`, `editor-vendor`. Chạy `vite-bundle-visualizer`: screenshot trước/sau. Tính: Main bundle giảm %? Mở /analytics trong Network — chunk chart-vendor chỉ xuất hiện ở thời điểm điều hướng. Sau đó bật `Link prefetch` và xác nhận chunk "về trước khi bấm" khi hover.

## Reference
- [Vite — Code Splitting](https://vite.dev/guide/features.html#manual-chunks)
- [React Router — Lazy Loading](https://reactrouter.com/how-to/lazy-loading)
- [React.lazy + Suspense](https://react.dev/reference/react/lazy)