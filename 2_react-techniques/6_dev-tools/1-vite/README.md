# Vite cho React

> Nguồn: https://vite.dev/guide/ — https://vite.dev/plugins/

## Mục tiêu
- Nắm luồng hoạt động của Vite: dev server ESM + HMR, production build tree-shaking.
- Cấu hình được bộ plugin cơ bản, proxy API dev, và tách bundle bằng `manualChunks`.
- Biết dùng `vite preview` và `rollup-plugin-visualizer` để kiểm tra bản production.

## Tổng quan
- Vite là build tool mặc định của hệ sinh thái React hiện đại: dev server khởi động nhanh, HMR gần như tức thời, build bằng Rollup (Vite 7 chuyển linh hoạt sang Rolldown khi bật thử nghiệm).
- Giải quyết vấn đề dev chậm của Webpack (bundle toàn bộ trước khi chạy) bằng cách serve **ESM native**: chỉ transform file đang dùng.
- Template chuẩn: `npm create vite@latest -- --template react-ts`.
- Áp dụng mọi dự án React mới; thay webpack/gulp khi cần tốc độ + cấu hình ngắn gọn.

## Khái niệm cốt lõi
- **Dev server**: trình duyệt tải `import` trực tiếp; Vite pre-bundle dep (esbuild) và serve source file qua transform ESM.
- **HMR**: khi sửa file, Vite gửi qua WebSocket, thay module mà không reload trang; `import.meta.hot` nếu cần custom.
- **Production build**: gom + minify + code-split bằng Rollup; out cho vào `dist/`.
- **Plugin**: đối tượng với hooks (transform, resolve); phổ biến: `@vitejs/plugin-react`, `vite-tsconfig-paths`, `vite-plugin-pwa`.
- **Proxy dev**: `server.proxy` chuyển `/api/*` sang server thật → tránh CORS khi dev, không cần sửa code.
- **Env & mode**: biến `VITE_*` xuất ra `import.meta.env` (xem nhóm `4_security-config/2-env-config`).
- **manualChunks**: gom vendor riêng để browser cache lâu hơn; Vite 7 cũng có `advancedChunks` cho chunk nhỏ gọn hơn.

## Luồng hoạt động / Cách áp dụng
1. Scaffold: `npm create vite@latest -- --template react-ts`.
2. Cài plugin: `@vitejs/plugin-react`, `vite-tsconfig-paths`, tùy nhu cầu `vite-plugin-pwa`/`vite-plugin-checker`.
3. Cấu hình `vite.config.ts`: plugins, `server.proxy`, `build.rollupOptions.output.manualChunks`, `sourcemap`.
4. Dev: `npm run dev`; vào `http://localhost:5173`.
5. Build + preview: `npm run build && npm run preview` để kiểm tra bản production local.
6. Phân tích bundle bằng `rollup-plugin-visualizer` trước khi tối ưu.

## Ví dụ chi tiết
```ts
// vite.config.ts — cấu hình chuẩn một dự án React 19 + TS
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),                          // JSX transform + fast refresh (HMR React)
    tsconfigPaths(),                  // đọc alias @/ từ tsconfig paths
    visualizer({ open: false, gzipSize: true }), // phân tích bundle khi build
  ],
  server: {
    port: 5173,
    // Dev không bị CORS: /api/... → localhost:3000 (server backend)
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Gom react + phần lớn lib vào 1 chunk vendor → cache tốt hơn
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
```

```tsx
// src/main.tsx — entry chuẩn Vite + React 19
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Env typed ở client (xem nhóm 4_security-config/2-env-config)
export const apiUrl = import.meta.env.VITE_API_URL as string;
```

```json
// package.json — scripts quen thuộc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

## Giải thích từng phần
- `@vitejs/plugin-react`: Babel plugin + Fast Refresh; bắt buộc cho JSX React.
- `tsconfigPaths()`: alias `@/components/...` trùng tsconfig → import ngắn gọn.
- `proxy '/api'`: mọi request `/api/*` khi dev được chuyển sang `http://localhost:3000`; production vẫn trỏ CDN/nginx.
- `manualChunks['react-vendor']`: react + react-dom tách riêng → khi chỉ sửa code app, browser không re-download vendor.
- `sourcemap: true`: giúp debug production; cân nhắc `hidden` nếu không muốn lộ source.

## Lỗi thường gặp / Chống chỉ định
- **Thiếu `vite-tsconfig-paths` mà import alias `@/`**: build báo không resolve → cài plugin hoặc dùng đường dẫn tương đối.
- **Chỉ `proxy` target sai port**: API 404 ở dev → match đúng target backend và đường dẫn.
- **Set `manualChunks` quá mịn** (mỗi lib 1 chunk): quá nhiều file nhỏ, cache kém → gom theo nhóm lớn.
- **Bật `sourcemap` ở production bừa**: lộ source; giữ `hidden` hoặc chỉ dùng khi debug.
- **Nâng cấp Vite bỏ qua Node version**: Vite 7 cần Node 20.19+/22.12+ → check `node -v` khi upgrade.

## Best practices / Mẹo
- Giữ `tsc --noEmit` trong script build để bắt lỗi type trước khi bundling.
- Bật `vite-plugin-checker` nếu muốn type error hiện ngay trong dev server.
- Đặt `base: '/'` rõ ràng nếu deploy sub-path.
- Dùng `vite preview` như bản smoke-test production trước khi đưa lên CDN.
- Xem `rollup-plugin-visualizer` và `bundle-analyzer` định kỳ để theo dõi bundle phình.

## Bài tập nhỏ
Thêm `alias` `@components` trong vite.config, tạo thư mục `src/components`, import thử. Sau đó build với `visualizer`, ghi lại 3 chunk lớn nhất và đề xuất cách giảm dung lượng.

## Reference
- [Vite Guide](https://vite.dev/guide/)
- [Vite Plugins](https://vite.dev/plugins/)
- [Vite — Env and Mode](https://vite.dev/guide/env-and-mode.html)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)