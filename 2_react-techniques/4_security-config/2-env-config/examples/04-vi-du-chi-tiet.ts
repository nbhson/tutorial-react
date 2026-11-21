// vite.config.ts — đọc env ở tầng config (không expose ra client)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // '' = đọc cả biến không có VITE_
  return {
    plugins: [react()],
    server: {
      // Proxy tránh CORS khi dev; secret target chỉ sống ở config, không vào bundle
      proxy: { '/api': { target: env.API_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
    },
  };
});
