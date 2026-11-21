// ✅ ĐÚNG: dev không CORS, code không đổi giữa dev/prod (dùng /api tương đối)
server: { proxy: { '/api': 'http://localhost:3000' } }
// fetch('/api/me') ở dev → Vite chuyển sang :3000; ở prod → Nginx/CDN chuyển
