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
