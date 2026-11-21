// ✅ ĐÚNG: kiểm tra index.html + code phòng thủ
// index.html: <div id="root"></div>
const el = document.getElementById("root") ?? document.body; // fallback nếu thiếu
createRoot(el).render(<StrictMode><App /></StrictMode>);
