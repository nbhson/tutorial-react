# Vite cho React

> Nguồn: https://vite.dev/guide/ — https://vite.dev/plugins/

## Mục tiêu

### 1. Nắm luồng Vite: dev server ESM + HMR, production build tree-shaking

**Vì sao:** Webpack dev chậm vì bundle toàn bộ trước khi chạy (đổi 1 file chờ 10s). Vite serve ESM native: trình duyệt `import` trực tiếp, Vite chỉ transform file đang dùng (esbuild pre-bundle dep) — đổi file thấy ngay mili-giây. Production gom + minify + code-split bằng Rollup (Vite 7 thử Rolldown) ra `dist/`. Hiểu luồng để biết chậm ở đâu (transform? plugin? PostCSS?) và tối ưu đúng chỗ.

**Cơ chế dev:** `npm run dev` → server 5173 → HTML nạp `main.tsx` → mỗi `import` là một request transform riêng. Sửa file → WebSocket báo HMR → thay module đó, không reload trang (state giữ). `import.meta.hot` cho custom HMR khi cần. Production: Rollup graph, tree-shake (`sideEffects: false` để bỏ dead export), minify, hash, split chunk. Ví von: dev Webpack như nấu cả nồi lẩu rồi mới nếm, dev Vite như nêm nếm từng thìa ngay trên bếp.

> **Tóm gọn 1 câu:** Mục tiêu của bài: nắm luồng dev/build của Vite, cấu hình plugin + proxy chuẩn, và biết đo bản production bằng preview + visualizer.

### 2. Cấu hình plugin cơ bản, proxy API dev, tách bundle bằng `manualChunks`

**Vì sao:** plugin là cách Vite mở rộng (JSX, alias, PWA, checker). Proxy `/api → localhost:3000` tránh CORS khi dev mà không sửa code (prod trỏ Nginx/CDN). `manualChunks` gom vendor để cache lâu (sửa app không tải lại react 140KB).

### 3. Biết `vite preview` + visualizer để kiểm tra bản production

**Vì sao:** dev nhanh không có nghĩa prod nhanh. `vite preview` serve `dist/` local để smoke-test (chunk nào, size nào, header nào) trước khi lên CDN. Visualizer treemap cho biết 3 chunk lớn nhất để tối ưu (thay lib, lazy, tách vendor).

## Tổng quan

- Vite là build tool mặc định React hiện đại: dev khởi động nhanh, HMR tức thời, build Rollup (Vite 7 linh hoạt Rolldown thử nghiệm).
- Giải quyết dev chậm của Webpack (bundle hết trước khi chạy) bằng ESM native: chỉ transform file đang dùng. Template chuẩn: `npm create vite@latest -- --template react-ts`.
- Mọi dự án React mới; thay webpack/gulp khi cần tốc độ + config ngắn gọn. Vite 7 cần Node 20.19+/22.12+ — nâng Vite mà quên Node là build gãy.

## Khái niệm cốt lõi

Mục này đi qua 7 mảnh ghép của Vite: dev server ESM, HMR, build production, plugin, proxy, env, và tách vendor. Đọc để hiểu "Vite làm gì ở từng chặng" — từ lúc bấm `npm run dev` tới lúc mở trang prod.

### 1. Dev server — ESM + esbuild pre-bundle + transform theo request

Trình duyệt tải `import` trực tiếp; Vite pre-bundle dep (esbuild, nhanh vì Go) và serve source qua transform ESM. Sửa file nào transform file đó — không bundle lại cả app. Chậm dev thường do plugin transform nặng (checker, Tailwind scan rộng) — đo bằng `--debug` để biết plugin nào.

### 2. HMR — WebSocket thay module, không reload

Sửa file → server đẩy update qua WS → client thay module, giữ state component (Fast Refresh). HMR gãy (trang reload trắng) thường do export lẫn lộn (component + const không phải component) — `react-refresh/only-export-components` bắt. Custom HMR (`import.meta.hot.accept`) chỉ khi cần (store ngoài, canvas).

### 3. Production build — Rollup gom + minify + split ra `dist/`

Hash theo nội dung để cache (`index-abc.js` — đổi code mới đổi hash). Sourcemap để debug prod (`true` lộ source — cân nhắc `hidden` chỉ upload Sentry). `base: '/'` rõ ràng nếu deploy sub-path (sai base là asset 404).

### 4. Plugin — hooks transform/resolve; bộ chuẩn React

`@vitejs/plugin-react` (JSX + Fast Refresh, bắt buộc), `vite-tsconfig-paths` (alias `@/` trùng tsconfig), `vite-plugin-pwa` (service worker), `vite-plugin-checker` (type error hiện ở dev). Plugin order sai (PWA trước React) là build lạ — giữ thứ tự docs.

### 5. Proxy dev — `/api/*` sang backend, tránh CORS

> 📄 **Code ví dụ:** [`examples/01-5-proxy-dev-api-sang-backend-tranh-cors.ts`](examples/01-5-proxy-dev-api-sang-backend-tranh-cors.ts)

**Sai thì sao:** hardcode `http://localhost:3000/api` trong code → prod gọi nhầm local, CORS vỡ. Fix: fetch đường tương đối + proxy dev + rewrite prod.

### 6. Env & mode — `VITE_*` ra `import.meta.env`

Chỉ biến `VITE_` mới lộ ra client (tránh lộ secret server). `import.meta.env.PROD/DEV/MODE` để rẽ nhánh. Chi tiết secret xem nhóm `4_security-config/2-env-config` — không bao giờ `VITE_SECRET_KEY`.

### 7. manualChunks/advancedChunks — vendor riêng để cache

Gom `react-vendor` để sửa app không tải lại vendor. Vite 7 `advancedChunks` gom chunk nhỏ gọn hơn `manualChunks` thô. Quá mịn (mỗi lib 1 chunk 5KB) là phí request — gom nhóm ≥ 20KB.

> **Tóm gọn 1 câu:** Vite = dev nhanh nhờ ESM + HMR, prod gọn nhờ Rollup tree-shaking + tách vendor — mọi cấu hình xoay quanh hai mục tiêu đó.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước dựng một dự án Vite chuẩn từ scaffold tới tối ưu — đi theo thứ tự thì mỗi thay đổi đều kiểm chứng được.

### Bước 1. Scaffold `react-ts`

`npm create vite@latest -- --template react-ts`, Node đúng version. Chạy dev xác nhận 5173 + HMR (sửa chữ thấy ngay không reload).

### Bước 2. Cài plugin chuẩn

`@vitejs/plugin-react`, `vite-tsconfig-paths`, tùy `pwa`/`checker`. Alias `@/` cả `vite.config` lẫn `tsconfig paths` (lệch một bên là import 404 một môi trường).

### Bước 3. Config `vite.config.ts`: plugins, proxy, manualChunks, sourcemap

Như Ví dụ chi tiết. `base` rõ ràng. `chunkSizeWarningLimit` hợp lý (không tắt cảnh báo để giấu phình).

### Bước 4. Dev ở 5173, build + preview trước khi đẩy

`npm run dev` daily; `npm run build && npm run preview` trước mỗi release để bắt lỗi chỉ hiện ở prod (base sai, chunk thiếu, env thiếu).

### Bước 5. Visualizer trước khi tối ưu

`rollup-plugin-visualizer` (`gzipSize: true`) — 3 chunk lớn nhất là backlog (thay lib → lazy → tách vendor theo thứ tự rẻ trước đắt sau).

> **Tóm gọn 1 câu:** Scaffold chuẩn → plugin tối thiểu → config gọn → preview trước khi đẩy → visualizer trước khi tối ưu.

## Ví dụ chi tiết

Mirror đầy đủ với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.ts`](examples/02-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.json`](examples/04-vi-du-chi-tiet.json)

## Giải thích từng phần

### `@vitejs/plugin-react` — Babel + Fast Refresh, bắt buộc

Không có là JSX không biên dịch / HMR mất state. Gãy HMR (reload trắng mỗi sửa) → kiểm tra `only-export-components` (export lẫn) trước khi đổ cho plugin.

### `tsconfigPaths()` — alias trùng tsconfig

`@/components/X` ngắn, chuyển thư mục không sửa 20 import. Thiếu plugin mà import `@/` → dev có thể chạy (IDE resolve) nhưng build báo không resolve — lỗi "máy tôi chạy được" kinh điển.

### `proxy '/api'` — dev chuyển, prod Nginx/CDN chuyển, code giữ tương đối

Mọi `fetch('/api/*')` dev về `:3000`; prod về cùng origin (Nginx reverse). Code không hardcode host — đổi môi trường không sửa code.

### `manualChunks['react-vendor']` — sửa app không tải lại vendor

React 140KB hash giữ qua nhiều deploy → user tải 1 lần. Không tách → mỗi deploy tải lại cả vendor dù chỉ sửa 1 dòng chữ.

### `sourcemap: true` vs `hidden` — debug được mà không lộ source

`true`: browser tải `.map`, ai cũng đọc source. `hidden`: không reference map (browser không tải) nhưng vẫn upload Sentry để giải stack prod. Ví von: `true` là để bản đồ kèm kho báu ngoài bãi biển công cộng, `hidden` là cất bản đồ ở két riêng nhưng người của bạn (Sentry) vẫn có bản sao. Prod công khai dùng `hidden`; nội bộ debug dùng `true`.

## Lỗi thường gặp / Chống chỉ định

### 1. Thiếu `vite-tsconfig-paths` mà import `@/` → build không resolve

Cài plugin + đồng bộ `tsconfig paths` + `vite resolve.alias` (2 nơi phải khớp). Hoặc dùng tương đối tạm.

### 2. Proxy sai port → API 404 ở dev

Match đúng backend + path (`/api` có rewrite không?). Log network xem request đi đâu — 404 dev mà prod được là mùi proxy.

### 3. `manualChunks` quá mịn → nhiều file nhỏ, cache kém

Gom nhóm lớn (≥ 20KB). Visualizer chunk nào < 10KB là gom lại.

### 4. Sourcemap prod bừa → lộ source

Công khai dùng `hidden` + Sentry; chỉ `true` khi debug có kiểm soát. Kiểm tra `dist/*.map` có deploy lên CDN không.

### 5. Nâng Vite quên Node → build gãy

Vite 7 cần Node 20.19+/22.12+. `node -v` trước khi nâng; CI pin Node đúng.

> **Tóm gọn 1 câu:** 5 lỗi kinh điển: thiếu plugin alias (build 404), proxy sai port, chunk quá mịn, sourcemap lộ source, nâng Vite quên Node.

## Best practices / Mẹo

### `tsc --noEmit` trong build; checker hiện lỗi ở dev; `base` rõ; preview smoke-test; visualizer định kỳ

Type đỏ là đỏ trước khi bundling. Checker để không phải chờ build mới biết sai type. Sub-path deploy mà `base: '/'` là asset 404 — đặt `/app/` đúng. Preview là rehearsal prod (chunk, env, base) — không bỏ. Visualizer + bundle-analyzer định kỳ để phình là biết ngay khối nào.

> **Tóm gọn 1 câu:** `preview` là buổi diễn tập prod, visualizer là máy soi cân nặng bundle — hai thói quen này giữ Vite chạy khỏe lâu dài.

## Bài tập nhỏ

1. Thêm alias `@components` ở cả `vite.config` + `tsconfig`, tạo `src/components`, import thử (xác nhận dev + build đều resolve).
2. Build với visualizer, ghi 3 chunk lớn nhất + gzipSize.
3. Đề xuất giảm: thay lib nặng? lazy route nào? tách vendor nào? Thực hiện 1 đề xuất, build lại, ghi % giảm.
4. `preview` kiểm tra: chunk mới có tải đúng lúc không, base có 404 không.

## Reference

- [Vite Guide](https://vite.dev/guide/)
- [Vite Plugins](https://vite.dev/plugins/)
- [Vite — Env and Mode](https://vite.dev/guide/env-and-mode.html)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
