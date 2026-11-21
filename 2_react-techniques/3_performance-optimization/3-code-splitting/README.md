# Code-Splitting

> Nguồn: https://react.dev/reference/react/lazy — https://vite.dev/guide/features.html#manual-chunks

## Mục tiêu

### 1. Chia bundle JS thành nhiều chunk để First Load chỉ tải phần cần thiết nhất

**Vì sao:** SPA gộp tất cả vào một file: mở login cũng tải 3MB dashboard chưa dùng. Parse/eval 3MB trên máy yếu mất 1–2s, LCP vượt 4s. Chia theo route (mỗi route một chunk) + vendor (thư viện lớn riêng) đưa file đầu về ~100–200KB gzip — shell hiện ngay, phần còn lại on-demand.

**Cơ chế:** `lazy(() => import('./pages/X'))` tạo split point — Rollup tách file đó thành chunk riêng. `manualChunks` gom vendor theo nhóm (`chart-vendor`) để lib nặng không lẫn page chunk và hash ổn định để cache. Trình duyệt tải main trước, chunk khác khi điều hướng/hover.

> 📄 **Code ví dụ:** [`examples/01-1-chia-bundle-js-thanh-nhieu-chunk-e.ts`](examples/01-1-chia-bundle-js-thanh-nhieu-chunk-e.ts)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/02-1-chia-bundle-js-thanh-nhieu-chunk-e.ts`](examples/02-1-chia-bundle-js-thanh-nhieu-chunk-e.ts)

**Usecase thực tế:** app 4 route + recharts + Monaco. Trước: index 2.8MB. Sau: index 180KB + analytics chunk + editor chunk + 2 vendor chunk. Mở login chỉ 180KB; vào /analytics mới thêm chart-vendor. Quy tắc nhận diện: bundle đầu > 150–200KB gzip, hoặc visualizer thấy 1–2 khối > 200KB → tách ngay. App < 100KB → đừng tách, thêm request vô ích.

### 2. Tách vendor nặng (chart, editor, PDF) thành chunk riêng — không kéo theo màn hình đầu

**Vì sao:** vendor nặng đổi hiếm (recharts năm đổi vài lần) nhưng page code đổi liên tục. Gộp chung thì mỗi lần sửa page là hash cả bundle đổi → user tải lại cả vendor 500KB vô ích. Tách ra: sửa page chỉ đổi hash page chunk, vendor hash giữ nguyên → browser dùng cache.

**Cơ chế:** `manualChunks` gom import cùng nhóm vào một file output có hash theo nội dung nhóm. Đổi code page không đổi nội dung vendor → hash vendor giữ → HTTP cache hit. Đặt `chunkFileNames` có hash để cache đúng.

### 3. Tận dụng prefetch khi user sắp click để trải nghiệm "tức thì"

**Vì sao:** tách xong, lần đầu vào route nặng vẫn chờ network (fallback hiện). Prefetch lấp khoảng này: hover/focus link là chunk bay về trước, bấm là có ngay — user không bao giờ thấy "Đang tải".

**Cơ chế:** `onMouseEnter={() => import('./page')}` chạy promise sớm (module cache), mount sau dùng ngay. React Router `<Link prefetch="intent|viewport">` tự động (hover hoặc vào viewport là preload chunk + loader). Không prefetch mọi link (tốn data) — chỉ route khả năng cao kế tiếp. Ví von: prefetch như bạn nhìn thấy khách định gọi món là pha chế sẵn — khách bấm xuống thì nước đã trên bàn.

> **Tóm gọn 1 câu:** Mục tiêu của bài: cắt bundle theo route + vendor để màn hình đầu nhẹ nhất có thể, và dùng prefetch để lần điều hướng sau "tức thì".

## Tổng quan

Một SPA gộp mọi thứ vào một file JS duy nhất: user mở trang đăng nhập cũng phải tải 3MB code dashboard chưa dùng. **Code-splitting** cắt bundle theo ranh giới tự nhiên: **route** (mỗi route một chunk) và **vendor** (thư viện lớn đứng riêng) — kết quả là file đầu chỉ ~100–200KB gzip, phần còn lại tải on-demand đúng lúc.

Ở tầng cơ chế, `import()` động và `React.lazy` đã có (xem bài 1-lazy-dynamic-import); bài này nhấn khía cạnh *chiến lược chia*: chia ở đâu (route vs vendor vs locale), ai tách (Rollup tự động vs `manualChunks` tay), prefetch thế nào (hover/focus/viewport), đo bằng gì (visualizer, Network Transfer Size, Lighthouse "Reduce unused JavaScript"). Kết hợp lazy + ErrorBoundary để bắt lỗi chunk, `route.lazy` để gộp loader + component, tree-shaking + thay lib nặng trước khi tách.

## Khái niệm cốt lõi

Mục này trả lời 5 câu hỏi chiến lược: chia ở đâu trước (route), gom gì lại (vendor), khi nào prefetch, chia mịn tới đâu là đủ, và đo bằng công cụ nào. Đọc để chọn đúng "dao cắt" cho từng loại code.

### 1. Route-based splitting — mỗi route một chunk, tải khi điều hướng

**Vì sao là mức chia đầu tiên:** route là ranh giới tự nhiên nhất (mỗi URL một màn hình), 1 chunk/page thường đủ tốt mà không cần suy nghĩ. React Router v7 `route.lazy = () => import('./pages/x')` còn gộp loader + Component vào một chunk — giảm waterfall (không tải component xong mới biết cần data gì).

> 📄 **Code ví dụ:** [`examples/03-1-route-based-splitting-moi-route-mot-chunk.tsx`](examples/03-1-route-based-splitting-moi-route-mot-chunk.tsx)

**Sai thì sao:** lazy cả route login/home (màn hình đầu) → LCP phải chờ network. Fix: giữ critical route import tĩnh, lazy route sau login.

### 2. Vendor/chunk splitting — `manualChunks` gom nhóm để cache ổn định

**Vì sao tay thay vì tự động:** Rollup tự chia theo dynamic import — đủ cho app vừa. Gộp tay cần khi muốn hash vendor ổn định (đổi page không mất cache vendor) hoặc nhóm đúng miền (`chart-vendor`, `editor-vendor`) để một route độc lập mang đúng vendor nó cần.

**Lợi ích kép:** (1) lib nặng không lẫn page chunk (sửa page không invalidation chart); (2) `react-vendor` gần như bất biến → URL hash giữ nguyên → HTTP cache dài. Quá tay (mỗi lib 5KB một chunk) thì phí request — gom nhóm ≥ 20KB.

### 3. Prefetch — hover/focus/viewport tải trước

**Vì sao không phải lúc nào cũng cần:** chunk < 50KB tải lúc điều hướng cũng nhanh (vài chục ms), prefetch chỉ thêm tốn data. Chunk > 100KB hoặc flow chính (bước tiếp theo 80% user đi) thì prefetch đáng giá.

> 📄 **Code ví dụ:** [`examples/04-3-prefetch-hover-focus-viewport-tai-truoc.tsx`](examples/04-3-prefetch-hover-focus-viewport-tai-truoc.tsx)

### 4. Cân bằng chunk — overhead request vs lợi ích tách

Mỗi request tốn ~30–80ms overhead (DNS/handshake/header nếu không HTTP/2). 200 chunk 5KB chậm hơn 20 chunk 50KB. Ví von: đi chợ 200 lần mỗi lần mua 1 củ cà rốt thì tốn xăng hơn đi 20 lần mua đủ cả giỏ. Ngưỡng thực dụng: chunk ≥ ~20KB mới đáng tách; tổng < 50 chunk với HTTP/2. Đo First Load (gzip) + số chunk sau mỗi lần tách để không phân mảnh quá mức.

### 5. Đo lường — visualizer + Network + Lighthouse

`vite-bundle-visualizer`/`rollup-plugin-visualizer` xem treemap (khối nào to). DevTools Network cột Transfer Size xem chunk nào bay lúc nào. Lighthouse "Reduce unused JavaScript" xác nhận split có bớt JS thừa thật. Mục tiêu: JS critical < 200KB gzip.

> **Tóm gọn 1 câu:** Route là ranh giới chia đầu tiên, vendor gom để cache bền, prefetch là "pha nước trước khi khách gọi", và mọi lần tách đều phải đo lại bằng visualizer.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước từ "tìm khối to nhất" tới "ghi budget vào CI" — làm theo thứ tự thì mỗi lần tách đều thấy rõ tác dụng.

### Bước 1. Build + visualizer → tìm 3 thứ to nhất

Chạy build, mở treemap, ghi tên + KB của 3 khối lớn nhất (vendor lớn, page ít dùng, module phình). Đó là backlog tách theo thứ tự.

### Bước 2. Lazy hóa route ngoài "trang đầu trọng yếu"

`lazy(() => import('./pages/X'))` + `Suspense` cho mọi route sau login. Giữ landing/login import tĩnh để LCP không chờ network.

### Bước 3. Tách lib nặng dùng rời rạc thành `manualChunks` riêng

Editor/chart/PDF mỗi thứ một vendor chunk. Lib 5KB mọi route dùng thì đừng tách. Mỗi locale i18n một chunk, lazy theo ngôn ngữ.

### Bước 4. Prefetch link trọng yếu, kiểm tra Network

Hover link → chunk xuất hiện trước khi click (Network). Dùng `prefetch="viewport"` cho link trong màn hình, `onMouseEnter` cho link ngoài.

### Bước 5. Re-measure: Total Size, số chunk, First Load gzip

So trước/sau: main giảm bao nhiêu %, số chunk bao nhiêu, First Load còn dưới 200KB không. Ghi vào CI budget để bắt hồi quy.

> **Tóm gọn 1 câu:** Quy trình: visualizer tìm thủ phạm → lazy route ngoài trang đầu → tách vendor nặng → prefetch link trọng yếu → đo lại và ghi budget.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), cộng config vendor:

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.ts`](examples/06-vi-du-chi-tiet.ts)

## Giải thích từng phần

### `lazy(() => import(...))` — Rollup thấy là tách

Đường dẫn tĩnh trong factory là split point. `Suspense` giữ UX lúc chunk về. React Router v7 `route.lazy` còn gộp loader + Component vào cùng chunk — giảm một bọc và một waterfall.

### `manualChunks` — lợi ích kép cache + cô lập

`react-vendor` bất biến → hash giữ → cache hit qua nhiều deploy. `chart-vendor` tách khỏi page → sửa Analytics không đổi hash chart. Đừng tách lib 5KB dùng khắp nơi — phí request mà không bớt parse đáng kể.

### `Suspense` cho page controller là đủ

Thành phần nhỏ trong page đã nằm cùng page chunk (lazy theo page) — không cần Suspense riêng từng cái. Thêm Suspense nhỏ chỉ cho widget nặng trong page (chart trong dashboard) để skeleton phân tầng.

### Đừng `manualChunks` quá tay

100KB chart một route dùng → tách đúng. 5KB util mọi route dùng → đừng tách. Kiểm tra visualizer sau tách: chunk nào < 10KB thì gom lại.

> **Tóm gọn 1 câu:** `lazy` là split point, `manualChunks` là bảng phân loại để cache bền — tách đúng ranh giới thì nhanh, tách quá mịn thì phí request.

## So sánh (nếu có)

### One-bundle vs multi-chunk

Một file: ít request, đơn giản, nhưng First Load dài, sửa 1 dòng tải lại tất cả. Nhiều chunk: First Load nhanh, cache tốt, nhưng cần kiểm soát số chunk và xử lý loading giữa chừng. Ví von: một file như vác nguyên chiếc tủ đi loanh quanh trong nhà, nhiều chunk như tháo từng ngăn mang ra khi cần. App < 100KB giữ một file; trên thì chia.

### manualChunks tay vs Rollup tự chia

Tự chia theo entry/dynamic — đủ cho app vừa, không cần nghĩ. Tay cần khi muốn hash ổn định (cache) hoặc nhóm miền (chart-vendor). Kết hợp: page tự chia + vendor lớn gộp tay.

### Prefetch hết vs có điều kiện

Hết: tốn băng thông (user data plan), có khi tải thứ không bao giờ dùng. Có điều kiện (flow chính, hover/focus/viewport): tốn ít mà trúng nhiều. Đo tỉ lệ hover→click để chọn link nào prefetch.

## Lỗi thường gặp / Chống chỉ định

### 1. Lazy cả route đầu → LCP chờ network

> 📄 **Code ví dụ:** [`examples/07-1-lazy-ca-route-au-lcp-cho-network.tsx`](examples/07-1-lazy-ca-route-au-lcp-cho-network.tsx)

### 2. `manualChunks` quá mịn (< 10KB/chunk) → phí request

Gom nhóm ≥ 20KB, xác nhận bằng visualizer. Chunk chung (`common`) không để lặp vendor giữa các entry.

### 3. Không tách vendor → sửa page mất cache cả bundle

Tách vendor + `chunkFileNames` có hash. Mỗi deploy chỉ đổi hash chunk bị sửa, còn lại cache hit.

### 4. Asset/token trong chunk sai scope

Đừng nhồi asset path vào `manualChunks`; public assets để riêng. Font/ảnh dùng `assetFileNames` có hash riêng.

### 5. Chống chỉ định: mạng chậm nhiều chunk nhỏ, app rất nhỏ

Di động yếu: mỗi chunk một round-trip — ít chunk vừa phải tốt hơn nhiều chunk nhỏ. App < 100KB: tách chỉ thêm phức tạp. Đo First Load trước rồi quyết.

> **Tóm gọn 1 câu:** 5 cạm bẫy: lazy route đầu (LCP chờ), chunk quá mịn (phí request), không tách vendor (mất cache), nhồi asset vào chunk (sai scope), và tách cho app bé xíu (thêm rối vô ích).

## Câu hỏi thường gặp

### Bao nhiêu chunk hợp lý?

Không số tuyệt đối: giữ chunk ≥ ~20KB, tổng < 50 với HTTP/2. Quan trọng hơn số là First Load < 200KB gzip và sửa page không mất cache vendor.

### Lazy ảnh hưởng SEO?

SSR/streaming: chunk vẫn render server đúng. SPA thuần: SEO phụ thuộc JS bất kể lazy. Không lấy SEO làm lý do không tách.

### `manualChunks` khác dynamic import?

Dynamic tách tự động theo `import()`; `manualChunks` gộp tay theo nhóm vendor để ổn định cache. Hai cơ chế bổ nhau, không thay nhau.

### Prefetch tốn data?

Có — chỉ prefetch route khả năng cao vào, hoặc lúc hover/focus (gần click) thay vì preload ngay từ đầu.

### Biết chunk nào nặng thế nào?

Visualizer treemap + Network Transfer Size + Lighthouse "Reduce unused JavaScript". Ba nguồn chéo nhau là chắc.

## Ghi chú 2026

- **Vite 7 + `chunkSizeWarningLimit`:** cảnh báo chunk lớn theo ngưỡng cấu hình; `advancedChunks` gom chunk nhỏ gọn hơn `manualChunks` thô.
- **`route.lazy` gộp loader + Component:** một chunk mang cả UI lẫn data cần — giảm waterfall so với bọc tay.
- **HTTP/2 + CDN edge:** nhiều chunk nhỏ đỡ tốn hơn trước, nhưng vẫn tránh phân mảnh (200 chunk 5KB vẫn chậm hơn 20 chunk 50KB).

## Best practices / Mẹo

### Budget đo được + `route.lazy` + vendor theo nhóm + ErrorBoundary

JS critical < 200KB gzip, chunk ≥ 20KB, < 50 chunk. `route.lazy` + `Link prefetch="viewport"` cho route trọng yếu. Vendor nhóm (`react-vendor`, `ui-vendor`, lib nặng riêng). Lazy luôn kèm ErrorBoundary + "Thử lại" (mạng kém chunk lỗi là bình thường).

### Cache hash + monorepo/federation + Lighthouse + tree-shaking trước khi tách

`chunkFileNames`/`assetFileNames` có hash để cache tối đa. Monorepo chia theo package + Federation cho remote. Lighthouse xác nhận bớt JS thừa. Thay lib nặng (moment → date-fns) trước khi tách — đôi khi bỏ được cả chunk. Budget trong CI, `sideEffects: false` + xóa dead export trước. i18n mỗi locale một chunk. `modulePreload` cho chunk chắc chắn dùng. Landing/login không lazy.

> **Tóm gọn 1 câu:** Số liệu dẫn đường: First Load < 200KB gzip, chunk ≥ 20KB, vendor theo nhóm có hash — và lazy nào cũng phải có ErrorBoundary chờ sẵn.

## Bài tập nhỏ

1. App 4 route + recharts + Monaco: lazy từng route; `manualChunks` tách `react-vendor`, `chart-vendor`, `editor-vendor`.
2. Chạy visualizer, screenshot trước/sau; tính main giảm bao nhiêu %.
3. Mở `/analytics` ở Network: xác nhận `chart-vendor` chỉ xuất hiện lúc điều hướng.
4. Bật `Link prefetch`, hover link analytics: xác nhận chunk về trước khi bấm. Ghi 3 con số (main trước/sau, thời điểm chart về, có/không prefetch khác gì).

## Reference

- [Vite — Code Splitting](https://vite.dev/guide/features.html#manual-chunks)
- [React Router — Lazy Loading](https://reactrouter.com/how-to/lazy-loading)
- [React.lazy + Suspense](https://react.dev/reference/react/lazy)
