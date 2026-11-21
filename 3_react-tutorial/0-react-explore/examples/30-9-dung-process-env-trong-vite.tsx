// ✅ ĐÚNG: dùng import.meta.env với tiền tố VITE_
// .env: VITE_API_URL=https://api.example.com
const api = import.meta.env.VITE_API_URL; // Vite thay thế lúc build
