# DAY 13: LAZY + SUSPENSE (MODULE)

## Mục tiêu bài học
- Hiểu code splitting: `lazy()` + `<Suspense>` tách các màn hình nặng (chart, editor) thành chunk riêng, Vite tự lo — tương đương `loadChildren` của Angular Router.
- Nắm vai trò của Error Boundary bọc ngoài Suspense cho trường hợp lazy load thất bại (mất mạng).
- Biết prefetch sớm (hover/focus/idle) để giảm cảm giác chờ đợi.

## Khái niệm cốt lõi (Core)

Mục này nói về bộ ba `lazy` + `Suspense` + Error Boundary: cách tách code nặng ra tải sau, hiện UI chờ, và bắt lỗi khi tải thất bại — đọc để biết "ai chờ, ai bắt lỗi" trước khi vào code.

### 1. `lazy(() => import("./HeavyChart"))` — tách chunk, tải khi render
`import()` động là cú pháp ES — Vite nhận diện lúc build, tách module đó thành **chunk riêng** (`HeavyChart-[hash].js`), `index` nhẹ. `lazy` bọc component: React chỉ tải chunk **lần đầu component được render** (không phải lúc `lazy()` gọi). Sau đó cache theo URL module — remount không tải lại. Ví von: giống như bạn không mang cả tủ sách theo từ nhà — sách nào cần đọc thì đi mượn đúng quyển đó, mượn rồi thì để ở chỗ quen để lần sau khỏi đi lại.

> 📄 **Code ví dụ:** [`examples/01-1-lazy-import-heavychart-tach-chunk-tai-khi.tsx`](examples/01-1-lazy-import-heavychart-tach-chunk-tai-khi.tsx)

Vì sao callback phải trả `{ default: Component }`? Vì `import()` trả module namespace (`{ default, Chart, ... }`), `lazy` lấy `.default`. Component export named (`export function Chart`) mà không default thì `lazy(() => import("./X"))` cho component rỗng — phải `.then(m => ({ default: m.Chart }))`. Quy tắc: file lazy luôn `export default` để khỏi `.then`.

> **Tóm gọn 1 câu:** `lazy` + `import()` là "mượn đúng quyển sách khi cần" — chunk nặng tách riêng, lần đầu render mới đi mượn, mượn rồi thì cache lại.

### 2. `<Suspense fallback>` — UI chờ cho suspend
Khai báo UI chờ cho mọi component suspend (lazy chưa tải xong, hoặc `use()` data chưa resolve DAY 12) bên trong nó. Không bọc là React lỗi "A component suspended... Add a <Suspense> boundary". Chu kỳ: mount → chunk chưa có → suspend → fallback hiện → chunk về → render thật. Ví von: Suspense là "tấm biển đang bốc xếp" — hàng hóa (chunk) chưa về thì treo biển lên, hàng về thì hạ biển mở bán.

> 📄 **Code ví dụ:** [`examples/02-2-suspense-fallback-ui-cho-cho-suspend.tsx`](examples/02-2-suspense-fallback-ui-cho-cho-suspend.tsx)

Vì sao Suspense gần nhất bắt? Vì React tìm boundary gần nhất phía trên để hiện fallback. Bọc cả app trong 1 Suspense là sai: tải 1 widget mà cả trang fallback. Đặt Suspense sát component lazy (mỗi vùng lazy một boundary) — vùng nào chờ thì vùng đó spinner.

> **Tóm gọn 1 câu:** Không có suspend nào sống thiếu Suspense — biển "đang tải" phải treo sát đúng khu vực đang chờ, đừng treo che cả cửa hàng.

### 3. Error Boundary — phần hay quên (bắt lỗi, không phải chờ)
Mục này về trường hợp xấu nhất: mạng đứt giữa chừng, chunk không bao giờ về — đọc để biết vì sao Suspense không cứu được và ai là người bắt lỗi thật sự.

Mất mạng khi tải chunk → `lazy` promise reject → component *throw lỗi* (không phải suspend). `fallback` của Suspense **không bắt lỗi**, chỉ bắt pending. Cần Error Boundary (class `componentDidCatch` hoặc `react-error-boundary`) **bên ngoài Suspense** để bắt và hiện fallback lỗi + nút thử lại. Ví von: Suspense là tấm biển "chờ hàng về", Error Boundary là thùng hàng "hàng hỏng trả lại" — hai thùng hai việc, không thùng nào thay được thùng nào.

> 📄 **Code ví dụ:** [`examples/03-3-error-boundary-phan-hay-quen-bat-loi.tsx`](examples/03-3-error-boundary-phan-hay-quen-bat-loi.tsx)

`react-error-boundary` cho sẵn `fallback`, `onError` (log), `resetKeys` (đổi key là thử lại, không kẹt fallback). Không tự viết class mỗi nơi.

> **Tóm gọn 1 câu:** Suspense bắt "chờ", Error Boundary bắt "hỏng" — bọc Boundary ngoài Suspense, dùng `react-error-boundary` đừng tự viết class.

### 4. Prefetch — tải trước khi cần
Mục này về mẹo "đi trước một bước": đoán người dùng sắp mở gì và tải chunk sẵn từ đó — đọc để biến spinner thành vô hình.
Với màn "hầu như chắc mở" (user hover nút Chart), gọi `import("./HeavyChart")` sớm (hover/focus/idle). Chunk tải trước; click sau render ngay. `lazy` dùng lại cache của `import()` — không tải 2 lần.

> 📄 **Code ví dụ:** [`examples/04-4-prefetch-tai-truoc-khi-can.tsx`](examples/04-4-prefetch-tai-truoc-khi-can.tsx)

Vì sao `onFocus` nữa? Vì chỉ `onMouseEnter` là bỏ qua keyboard user (Tab tới nút không preload, Enter vẫn chờ). Prefetch ẩu (gọi mỗi render, preload mọi thứ lúc mở app) thì mất ý nghĩa split — chỉ preload khi tín hiệu mạnh (hover/focus/viewport/idle) và chunk lớn.

> **Tóm gọn 1 câu:** Prefetch là "đi mượn sách trước khi tới giờ đọc" — đoán đúng tín hiệu (hover/focus/idle) thì user không bao giờ thấy spinner.

### Keyword chính
`lazy` (bọc, cần default), `Suspense`/`fallback` (UI chờ pending), dynamic `import()` (tách chunk), chunk/cache theo URL, Error Boundary (bắt error tải, bọc ngoài), prefetch (`onMouseEnter`/`onFocus`/idle), route `lazy` (DAY 14).

> **Tóm gọn 1 câu:** Nắm bộ từ này là đủ đọc mọi code splitting: lazy tải muộn, Suspense treo biển chờ, Boundary bắt lỗi, prefetch đi trước một bước.

## Luồng hoạt động (Flow)
Mục này đi theo hành trình một chunk từ lúc build tới lúc hiện lên màn hình — đọc để biết thứ tự sự kiện, không phải để thuộc thuộc lòng.
1. Module `App` chạy: `lazy(() => import(...))` — **chưa tải gì**, chỉ đăng ký promise + cache key theo URL. `preloadChart` cũng chỉ là hàm, chưa gọi.
2. Build: Vite thấy `import("./HeavyChart")` → tách `HeavyChart-[hash].js`; `index` chỉ App + nút. `npm run build` xem báo cáo chunk để biết index nhẹ bao nhiêu.
3. User hover/focus nút → `preloadChart()` → trình duyệt tải chunk nền. Chưa `setShow` nên chưa render `HeavyChart` — chỉ tải trước.
4. User click → `setShow(true)` → React render `<HeavyChart/>` → chunk chưa xong (nếu không preload) thì component "suspend".
5. React tìm `<Suspense>` gần nhất → render `fallback` ("Đang tải biểu đồ..."). Vùng khác ngoài Suspense vẫn tương tác bình thường.
6. Chunk về → promise resolve `{ default }` → React render thật `HeavyChart`; fallback biến mất. Không có JS animation nào — chỉ thay element.
7. Mất mạng → promise reject → lỗi ném lên → `ErrorBoundary` ngoài bắt → fallback lỗi ("Tải thất bại, thử lại.") + `resetKeys` cho thử lại. Suspense không tham gia bước này.
8. Lần mount sau (đóng/mở lại): chunk cache → render ngay, không fallback. Kiểm tra Network tab: lần 2 không request chunk nữa.
9. Route-level (DAY 14): `lazy: () => import("./pages/Chart")` → Router tải chunk khi vào route, tự bọc Suspense — không viết tay mỗi trang.
10. `resetKeys` (ví dụ `[show]`): đổi key là boundary reset, thử render lại thay vì kẹt fallback lỗi cũ.

> **Tóm gọn 1 câu:** Chunk là "hàng đặt trước": đăng ký lúc build, tải khi cần, chờ có biển, hỏng có thùng — lần sau cần thì hàng đã sẵn trong kho (cache).

## Ví dụ chi tiết
Mục này gom code hoàn chỉnh để copy chạy thử — đọc kèm `example.tsx` trong thư mục.
Khớp 1-1 với `example.tsx`:

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

Route-level lazy với React Router v7 (chi tiết DAY 14):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

Preload thủ công tái dùng cache (mẫu gọn):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng quyết định trong ví dụ — đọc khi bạn tự hỏi "vì sao đặt đây mà không đặt chỗ khác".
- Dòng `lazy(() => Promise.resolve({ default: ... }))`: demo không cần file thật. Vì sao shape `{ default }`? Vì `lazy` lấy `.default` làm component. Prod thay bằng `import("./HeavyChart")` (trả module có `.default` nếu file export default).
- Dòng `{show && <Suspense>...}`: điều kiện (DAY 2) — chỉ mount khi mở nên chunk chỉ yêu cầu lúc mở (trừ preload). Không có là chunk tải ngay lúc mở app, mất ý split.
- Dòng `onMouseEnter={preloadChart}` + `onFocus`: prefetch 2 kênh (chuột + bàn phím). Vì sao không gọi trong render (`preloadChart()` ở body)? Vì render chạy mỗi lần state đổi — gọi mỗi render là tải ngay lúc mở app, split vô nghĩa. Chỉ gọi trong event có tín hiệu (hover/focus/idle/viewport).
- Vị trí Boundary ngoài Suspense: lỗi `lazy` ném lên phải gặp Boundary trước khi trồi khỏi Suspense. Vì sao Suspense không bắt? Vì Suspense chỉ đăng ký "pending" (promise chưa xong), không đăng ký "error" (promise reject). Hai kênh khác nhau.
- Dòng `react-error-boundary`: cung cấp Boundary function-ready (không cần class `componentDidCatch` tay) với `fallback` (UI lỗi), `onError` (log lên Sentry), `resetKeys` (đổi là thử lại). Dùng cho mọi lazy, không chỉ demo.
- Quy tắc **cache theo URL**: 2 `lazy(() => import("./HeavyChart"))` cùng URL dùng 1 chunk. `preloadChart` + `lazy` cùng URL nên preload rồi click không tải lại. Đổi query (`./HeavyChart?v=2`) là URL khác → tải lại.
- Quy tắc **Suspense nhỏ**: mỗi widget nặng một boundary riêng. Vì sao? Để tải chart thì chỉ vùng chart spinner, bảng bên cạnh vẫn dùng được. Một Suspense bọc cả trang là cả trang spinner khi 1 widget chậm.
- Quy tắc **Suspense + transition**: `useTransition`/`startTransition` khi điều hướng (DAY 14) để giữ UI cũ thay vì nháy fallback. Không có là click link nào cũng nháy loading dù chunk gần xong.

## Bảng so sánh Angular ↔ React
Mục này đối chiếu thói quen lazy-load cũ của Angular với cách React làm — đọc như tra từ điển khi chuyển dự án.

| Angular | React | Ghi chú |
|---|---|---|
| `loadChildren: () => import('./x.module')` (lazy route) | `lazy(() => import('./X'))` (lazy component) | Cùng dynamic import ES; React không gắn router, gắn được cả widget |
| Lazy route chỉ tải khi vào route | lazy component chỉ tải khi render (hoặc route `lazy` DAY 14) | React linh hoạt hơn (route + widget) |
| Router loading outlet/fallback | `<Suspense fallback={...}>` | UI chờ chunk, đặt sát lazy |
| `PreloadAllModules`/`preloadStrategy` (Router) | `onMouseEnter/onFocus={() => import(...)}`; Router v7 prefetch flag | Không global strategy built-in, tự preload theo tín hiệu |
| `@NgModule` tách module lười (wrapper) | file/chunk qua Vite (không wrapper) | Không module ceremony |
| Chunk fail → custom route error | ErrorBoundary bọc NGOÀI Suspense | Phải đúng thứ tự, Suspense không bắt lỗi |
| `RouterModule` preloading chiến lược | route `lazy: () => import(...)` + preload tay | Không mặc định, tự chọn |
| `@defer` block (Angular 17+: defer theo viewport/idle) | `lazy` + `<Suspense>` + preload idle/viewport tay | Cùng ý trì hoãn tải theo điều kiện |
| Route error handler | `ErrorBoundary` + route `errorElement` (DAY 14) | Lỗi tải chunk route cũng qua boundary |

> **Cách đọc bảng này:** mỗi dòng là một chiến lược lazy-load bên Angular, cột giữa là cách React làm tương đương, cột Ghi chú nêu điểm khác mấu chốt — đọc dọc theo tính năng bạn cần chuyển, đừng học thuộc cả bảng.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của code splitting — sập vào đây thì thường là trang trắng hoặc spinner kẹt, khó đoán nguyên nhân từ UI.

### 1. Quên `<Suspense>` → lỗi suspend không boundary
> 📄 **Code ví dụ:** [`examples/08-1-quen-suspense-loi-suspend-khong-boundary.tsx`](examples/08-1-quen-suspense-loi-suspend-khong-boundary.tsx)
> 📄 **Code ví dụ:** [`examples/09-1-quen-suspense-loi-suspend-khong-boundary.tsx`](examples/09-1-quen-suspense-loi-suspend-khong-boundary.tsx)

### 2. Tưởng Suspense bắt lỗi tải → trang trắng khi mất mạng
> 📄 **Code ví dụ:** [`examples/10-2-tuong-suspense-bat-loi-tai-trang-trang.tsx`](examples/10-2-tuong-suspense-bat-loi-tai-trang-trang.tsx)
> 📄 **Code ví dụ:** [`examples/11-2-tuong-suspense-bat-loi-tai-trang-trang.tsx`](examples/11-2-tuong-suspense-bat-loi-tai-trang-trang.tsx)

### 3. `lazy` sai shape (named export không map)
> 📄 **Code ví dụ:** [`examples/12-3-lazy-sai-shape-named-export-khong-map.tsx`](examples/12-3-lazy-sai-shape-named-export-khong-map.tsx)
> 📄 **Code ví dụ:** [`examples/13-3-lazy-sai-shape-named-export-khong-map.tsx`](examples/13-3-lazy-sai-shape-named-export-khong-map.tsx)

### 4. Prefetch ẩu (mỗi render / preload tất cả)
> 📄 **Code ví dụ:** [`examples/14-4-prefetch-au-moi-render-preload-tat-ca.tsx`](examples/14-4-prefetch-au-moi-render-preload-tat-ca.tsx)
> 📄 **Code ví dụ:** [`examples/15-4-prefetch-au-moi-render-preload-tat-ca.tsx`](examples/15-4-prefetch-au-moi-render-preload-tat-ca.tsx)

### 5. Một Suspense bọc cả trang → tải 1 widget cả trang spinner
> 📄 **Code ví dụ:** [`examples/16-5-mot-suspense-boc-ca-trang-tai-1.tsx`](examples/16-5-mot-suspense-boc-ca-trang-tai-1.tsx)
> 📄 **Code ví dụ:** [`examples/17-5-mot-suspense-boc-ca-trang-tai-1.tsx`](examples/17-5-mot-suspense-boc-ca-trang-tai-1.tsx)

### 6. Tự viết `componentDidCatch` mỗi nơi → lặp + khó reset
Mô tả: class Boundary tay thiếu `resetKeys`/`onError` chuẩn. Fix: `react-error-boundary` + `resetKeys={[show, location.pathname]}` để đổi route/show là thử lại, `onError` log Sentry.

## Best practices / Mẹo
Mục này là "kế hoạch split khôn ngoan": tách gì trước, đo thế nào, fallback bao nhiêu là đủ — đọc để split có chủ đích thay vì tách bừa.
- **Split theo route trước, widget nặng sau** (chart/editor/map). Vì sao thứ tự? Vì chunk route lớn nhất + ít vào cùng lúc — giảm index nhiều nhất. Widget chỉ khi đo thấy nặng.
- Data Router (DAY 14) route `lazy: () => import(...)` — Router tự chunk + suspense. Vì sao dùng? Để không viết tay `lazy`/`Suspense` mỗi trang, Router lo đồng bộ tải chunk + loader.
- Dữ liệu qua TanStack Query, không fetch trong chunk lazy. Vì sao tách? Vì chunk là code, query là data — gộp là vào route nào cũng fetch dù cache có.
- Đo: `npm run build` xem chunk size (visualizer). Mục tiêu index nhỏ, screen tách. Vì sao đo? Vì split mù (lazy mọi thứ nhỏ) tăng request mà không giảm index đáng kể.
- Fallback nhỏ (spinner dòng/skeleton dòng). Vì sao nhỏ? Vì tải nhanh (100ms) mà fallback to là nháy khó chịu; nhỏ thì gần như không thấy.
- Prefetch hover/focus/idle (`requestIdleCallback`)/viewport (IntersectionObserver). Vì sao nhiều kênh? Vì hover chỉ chuột, focus cho keyboard, idle cho "chắc chắn cần", viewport cho dưới màn hình.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài bắt bạn quan sát một hiện tượng trên Network tab hoặc UI, cách này nhớ lâu hơn đọc lại lý thuyết.

1. Tạo `src/pages` (Home/About/Chart), `lazy` + `Suspense` quanh Chart, bấm chuyển — Network tab thấy chunk riêng từng trang. Ghi size index trước/sau split.
2. Hai nút "Mở biểu đồ": một có `onMouseEnter` preload, một không — throttling mạng Slow 3G, so thời gian chờ. Vì sao preload thắng?
3. Bọc widget bằng Suspense riêng + ép reject (`lazy(() => Promise.reject(...))`) — quan sát Boundary fallback (không phải Suspense fallback). Đảo Boundary vào trong, quan sát trắng trang.
4. `resetKeys` để "Thử lại" render lại sau lỗi — không có là kẹt fallback dù mạng đã lại.
5. Route lazy Router v7 (`lazy: () => import(...)`) — quan sát chunk khi vào route (kết hợp DAY 14).

> **Tóm gọn 1 câu:** Code splitting chỉ đáng làm khi: index nhẹ đi thấy rõ, fallback nhỏ, lỗi có Boundary — tách bừa là tự làm chậm thêm.

## Reference
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense
- https://www.npmjs.com/package/react-error-boundary
