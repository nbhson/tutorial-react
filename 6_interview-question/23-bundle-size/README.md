# Q23: Build ra bundle JS quá to thì làm sao tìm và giảm được?

## Câu hỏi

> App React build ra 2MB+ JS — đo bằng gì trước, rồi tối ưu theo thứ tự nào (bỏ thư viện thừa, code splitting, tree shaking, tách vendor)? Size budget thì đặt ra sao? Khác Angular chỗ nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Quy trình đúng = đo trước, tối ưu sau**: build report/visualizer (treemap) tìm 3 chunk lớn nhất → nghi ngờ → sửa → đo lại → **budget CI** (script check size chạy bằng `bun run`) giữ không phình lại. Không số thì không sửa (bẫy §1).
- **Thứ tự tối ưu (rẻ trước, đắt sau)**: (1) **xóa lib không dùng** (moment → date-fns, lodash → tree-shake được), (2) **code splitting** (`React.lazy` + Suspense từng route, Router v7 route `lazy`), (3) **vendor riêng** (`manualChunks` — react/react-dom một chunk ổn định, app đổi không tải lại vendor), (4) assets (ảnh webp/avif + lazy, font swap).
- **Mục tiêu thực chiến**: **critical < 200KB gzip** (shell + route đầu) — không phải "bundle toàn bộ nhỏ nhất có thể".
- **Khác Angular**: cùng dynamic `import()` ES — Angular lazy theo **route module** (`loadChildren`, strategy preloading có sẵn); React lazy được **cả route lẫn widget** (linh hoạt hơn), nhưng preloading (hover/idle/viewport) **tự viết theo tín hiệu**.

## Trả lời chi tiết

### 1. Đo bằng gì (không đo = tối ưu mù)

| Công cụ | Cho biết gì | Dùng khi |
|---|---|---|
| `rollup-plugin-visualizer` (treemap, `gzipSize: true`) | **Khối nào phình** (lib nào chiếm KB) | Sau mỗi build quan trọng |
| `npm run build` report (Vite) | Kích thước chunk thô | Hàng ngày |
| Lighthouse / WebPageTest | **LCP** — bundle lớn = LCP cao | Chốt trước release |
| Script check size (gzip dist) trong CI (chạy `bun run`) | **Budget** (vượt = đỏ) | Mọi release |

> **Gzip/brotli là size người dùng THẬT** (trình duyệt nhận) — đánh giá bằng size đó, không phải size file thô. (Visualizer `gzipSize: true` để thấy đúng.)

### 2. Code splitting: `React.lazy` + `Suspense` (chunk chỉ tải khi cần)

```tsx
// Vite thấy import() động → tách file thành chunk riêng; index chỉ còn shell
import { lazy, Suspense } from "react";

const ChartPage = lazy(() => import("./pages/Chart")); // Chart-[hash].js riêng

<Suspense fallback={<p>Đang tải…</p>}>
  <ChartPage />
</Suspense>
```

- Chunk **chỉ tải lần đầu render** (không phải lúc `lazy()` gọi), sau đó cache theo URL (remount không tải lại).
- **Route-level với Router v7** (không viết tay Suspense mỗi trang):

```tsx
const router = createBrowserRouter([
  { path: "/chart", lazy: () => import("./pages/Chart") }, // Router tự split + Suspense
]);
```

- **Split theo route trước, widget nặng sau** (chart, editor, map) — route là chunk lớn nhất và ít vào cùng lúc. **Không lazy component nhỏ** (< ~20KB): request nhỏ tràn lan, TTFB tệ — hơn thiệt ngược.

### 3. Vendor riêng: `manualChunks` (cache lâu, sửa app không tải lại vendor)

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          // chunk hash ổn định (vendor hiếm đổi) → browser cache lâu
        },
      },
    },
  },
});
```

- **Vì sao đáng tiền**: sửa 1 dòng code app → chỉ app chunk đổi hash; `react-vendor` giữ nguyên → trình duyệt **không tải lại 140KB react** (bài Vite trong techniques).
- **Quy tắc**: gom nhóm **≥ ~20KB** (mỗi lib 1 chunk 5KB = phí request + cache kém — quá mịn là phản tác dụng, Vite 7 có `advancedChunks` gom gọn hơn).

### 4. Tree shaking — bỏ code không dùng (điều kiện + thói quen)

- **Cơ chế**: Rollup (prod build) theo graph import, bỏ **export không được gọi** — chỉ hoạt động với module **pure** (`sideEffects: false` trong package.json, hoặc code không có side effect ở top-level).
- **3 việc bạn làm được**:
  1. **Import chọn lọc, không import cả lib**: `import { debounce } from "lodash-es"` (ES) thay `import _ from "lodash"` (cjs, không shake được) — hoặc **chuyển lib** (moment 300KB không tree-shake được → date-fns/Day.js shake được).
  2. **Đừng import lib nặng chỉ để 1 function** (chart lib 500KB cho 1 đồ → cân nhắc lib nhẹ).
  3. **Đo bằng visualizer**: khối to mà bạn không dùng 90% tính năng → lazy module đó (split) hoặc thay lib.
- **Dev không shake** (build prod mới có) — size lúc dev không đại diện.

### 5. Assets — "nửa kia" của bundle size (thường bị quên, ăn LCP)

| Asset | Tối ưu |
|---|---|
| Ảnh | `webp`/`avif` (nhỏ hơn jpeg 30–50%), `loading="lazy"` dưới fold, **`width`/`height` hoặc `aspect-ratio`** (không CLS khi ảnh về), `<picture>` multi-format |
| Font | `font-display: swap` (chữ hiện bằng font hệ thống trước), preload font heading, subset (chỉ glyph dùng) |
| Data | **Data không nằm trong bundle** — server state để TanStack Query (Q20) (JSON 2MB nhét sang `src/data.ts` = bundle phình vô ích) |

Ảnh 2MB không nén làm LCP 4s **dù JS đã tối ưu sạch** — bundle nhỏ mà assets phình = LCP vẫn đỏ.

### 6. Budget CI — giữ không phình lại (điểm "quản lý" của câu hỏi)

```jsonc
// package.json — script check chạy bằng bun run (gắn vào pipeline build/CI)
"scripts": {
  "build": "vite build",
  "bundle:check": "node scripts/check-bundle.mjs" // đọc dist/assets, gzip đo, vượt 200kB → exit 1
}
```

```js
// scripts/check-bundle.mjs — ngắn gọn: gzip size critical chunk > budget là đỏ
// (đọc file dist, compress zlib gzip, so threshold; CI run: bun run build && bun run bundle:check)
```

- Không budget = tối ưu 1 tuần, phình lại 1 tháng sau (lib mới ai đó import). **CI đỏ khi vượt** = quản lý dài hạn.

### 7. Đối chiếu Angular (điểm ăn điểm)

| Angular | React | Ghi chú |
|---|---|---|
| `loadChildren: () => import('./x.module')` | `React.lazy(() => import('./X'))` / Router route `lazy` | Cùng **dynamic import ES**; React gắn được cả **widget** (không chỉ route) — linh hoạt hơn |
| `PreloadAllModules` / `PreloadAllModulesStrategy` (Router strategy) | `onMouseEnter`/`onFocus`/idle/viewport → `import()` | Angular có **strategy có sẵn**; React **tự viết theo tín hiệu** (hover chắc mở, idle cho route tiếp theo) |
| `@defer` (viewport/idle, Angular 17+) | `lazy` + preload manual (IntersectionObserver) | Cùng ý trì hoãn theo điều kiện |
| NgModules = biên giới module (ceremony tách) | Chunk do **bundler** (Vite/Rollup) quyết | React không wrapper module — tách bằng import động + `manualChunks` |
| Budget trong `angular.json` (warning/error theo size) | Script check size trong CI (bun run) | Cả hai đều **CI guard** — ý tưởng giống, công cụ khác |

> **Nói đúng câu chốt**: "Angular tối ưu bundle bằng **strategy router có sẵn** (preload/lazy module); React tối ưu bằng **bundler + tín hiệu** (code splitting tự động theo `import()`, vendor chunks theo cache, preloading theo hover/idle). Cùng mục tiêu critical-path nhỏ; khác ở 'ai giữ' — Angular framework nắm giữ, React bạn nắm giữ (library, Q1)."

## Bẫy khi phỏng vấn

1. **"Tối ưu bundle mà không đo trước"** → "giả" tối ưu (memo bừa, split bừa). Đúng: **visualizer → 3 khối lớn → sửa → đo lại → budget CI**.
2. **"Bundle nhỏ = LCP tốt"** → chưa đủ: **assets** (ảnh/font không nén) + **data** (API chậm) + **server** (TTFB) cùng ăn LCP. Bundle là 1 đầu mối, không phải tất cả.
3. **Lazy mọi component (kể cả nhỏ)** → request nhỏ tràn lan, TTFB tệ, cache kém. Quy tắc: **lazy route + widget nặng**; threshold ~20KB.
4. **`manualChunks` mỗi lib 1 chunk** → hàng chục file 5KB, phí request. Gom **nhóm ≥ 20KB** (vendor nhóm react-dom, chart lib riêng…).
5. **"Đã gzip là xong"** → gzip chỉ ~30–40% size thô; đánh giá bằng **gzip/brotli size thật** (visualizer `gzipSize`), và **data không nhét vào JS** (Query, Q20).
6. **Import `lodash`/`moment` cả lib** → CJS không tree-shake; `moment` 300KB vào bundle. Chuyển `date-fns`/`dayjs` (ES, shake được) hoặc bỏ luôn (native `Intl`).
7. **Nói "Vite dev nhanh = prod nhanh"** → dev không minify/shake/split (esbuild transform, không Rollup) — phải `npm run build && vite preview` + đo **bản prod thật**.

## Gợi ý câu chốt

> "Quy trình: **đo** (visualizer treemap gzipSize, LCP) → **sửa theo thứ tự rẻ-trước-đắt-sau**: xóa lib không dùng → **code splitting** (`React.lazy`/Router route lazy + Suspense, chunk chỉ tải khi render, cache theo URL) → **vendor riêng** (`manualChunks`, cache lâu, app đổi không tải lại react) → **assets** (webp/avif lazy + sizing, font swap) → **budget CI** (script check gzip dist, chạy `bun run`, vượt = đỏ). Tree shaking điều kiện: module pure + import chọn lọc (ES). Mục tiêu: **critical < 200KB gzip**. Khác Angular: cùng dynamic import ES — Angular có router strategy sẵn (preload/lazy module); React tự chủ: split được cả widget + preloading theo tín hiệu (hover/idle)."

## Reference

- [`3_react-tutorial/13-lazy-suspense`](../../3_react-tutorial/13-lazy-suspense) — `lazy` + Suspense + ErrorBoundary + prefetch, bảng Angular↔React (loadChildren, preload strategy, @defer)
- [`2_react-techniques/6_dev-tools/1-vite`](../../2_react-techniques/6_dev-tools/1-vite) — `manualChunks`/`advancedChunks` (vendor cache), visualizer treemap gzipSize, "gom nhóm ≥ 20KB"
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — đo trước (LCP/INP/CLS), "critical < 200KB gzip", lazy route + vendor + xóa lib, budget `size-limit`
- [`3_react-tutorial/14-router`](../../3_react-tutorial/14-router) — Router v7 route `lazy` (tự split + Suspense theo route)
- Q20 (fetch data) — data không nằm trong bundle (server state → Query)
- Q1 (library vs framework) — vì sao React không có "strategy có sẵn" như Angular

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q4 — HMR (dev build, khác prod)?](../04-hmr/README.md) · [Q29 — giữ UI mượt (performance runtime)?](../29-concurrency-transition-deferred/README.md)
- **Đào sâu (xuyên nhóm)**: [Q30 — pipeline render (chạy nhanh hay không)?](../30-rerender-pipeline/README.md) · [Q31 — list nặng: virtualize (bỏ render thừa) hay giảm code?](../31-virtualization/README.md) · [Q36 — lazy load theo route (tổ chức code ảnh hưởng bundle)?](../36-architecture-code-org/README.md)
