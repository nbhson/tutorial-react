// vite.config.ts — tách vendor theo nhóm (bổ sung cạnh example.tsx)
// Vì sao tách: react-vendor hash ổn định để cache; chart-vendor nặng chỉ analytics cần
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // gộp react + router vào 1 chunk ổn định (đổi code page không đổi hash vendor)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // chart riêng: chỉ route /analytics cần mới tải — không kéo 500KB vào First Load
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
};
