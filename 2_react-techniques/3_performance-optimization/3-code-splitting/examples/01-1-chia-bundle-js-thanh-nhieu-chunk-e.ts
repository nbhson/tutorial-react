// vite.config.ts — tách vendor để main nhẹ + cache tốt (comment tiếng Việt từng nhóm)
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // react + router gần như không đổi → hash ổn định → browser cache lâu
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // chart 500KB chỉ /analytics cần → không kéo vào First Load
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
};
