// vite.config.ts — mirror đầy đủ, khớp config chuẩn dự án React 19 + TS
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // JSX transform + Fast Refresh (HMR React) — bắt buộc
import tsconfigPaths from 'vite-tsconfig-paths'; // đọc alias @/ từ tsconfig paths — import ngắn, chuyển thư mục không vỡ
import { visualizer } from 'rollup-plugin-visualizer'; // treemap bundle khi build — biết khối nào phình

export default defineConfig({
  plugins: [
    react(), // Fast Refresh: sửa component không mất state (trừ khi export lẫn lộn)
    tsconfigPaths(), // @/components/... trùng tsconfig — thiếu plugin này mà import @/ là build báo resolve
    visualizer({ open: false, gzipSize: true }), // gzipSize để thấy size thật user tải, không phải size thô
  ],
  server: {
    port: 5173,
    // Dev không CORS: /api/... → localhost:3000 (backend) — code fetch('/api') tương đối, prod Nginx chuyển tiếp
    proxy: { '/api': 'http://localhost:3000' }, // sai port/target là API 404 ở dev — match đúng backend
  },
  build: {
    sourcemap: true, // debug prod — lộ source nên cân nhắc 'hidden' (chỉ upload Sentry, browser không tải)
    rollupOptions: {
      output: {
        // Gom react + phần lớn lib vào vendor → sửa code app không tải lại vendor (cache tốt hơn)
        // Vì sao: vendor hash ổn định (hiếm đổi) → browser cache lâu; page chunk đổi theo code
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
