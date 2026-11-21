// vite.config.ts (vite-plugin-react)
// Vite + React HMR (Hot Module Replacement) = "Fast Refresh": React component được thay
// mà không mất state (giữ state qua component boundary).
// Nếu component bị sửa "vượt boundary" (số hook đổi, export đổi) →
// Fast Refresh "không an toàn" → escalate full reload.
