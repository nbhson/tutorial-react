// ❌ SAI: main.tsx không import i18n — resources chưa nạp, t("hello") hiện "hello"
// main.tsx: createRoot(...).render(<App />);

// ✅ ĐÚNG: import trước render
// main.tsx:
import "./i18n"; // chạy init trước
createRoot(document.getElementById("root")!).render(<App />);
