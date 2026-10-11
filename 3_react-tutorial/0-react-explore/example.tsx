// example.tsx — DAY 0: entry tối giản (chạy với Vite + React 19)
// Mục đích: minh họa 2 file quan trọng nhất (index.html + main.tsx) gộp lại 1 file
// để người mới thấy toàn bộ "đường đi" từ DOM tới React trong vài dòng.
import { StrictMode } from "react"; // (1) Import component kiểm tra dev — chỉ tác dụng ở dev, prod bỏ qua
import { createRoot } from "react-dom/client"; // (2) Import API mount React 18+ — thay ReactDOM.render cũ

// (3) App là function component: hàm thường, KHÔNG decorator, trả về JSX.
// Vì sao viết hoa? JSX phân biệt component (PascalCase) với thẻ HTML (chữ thường).
function App() {
  // (4) Dùng fragment <>...</> để trả 2 element mà không thêm <div> thừa.
  // Fragment tương đương ng-container của Angular.
  return (
    <>
      <h1>Hello React 19 + Vite!</h1>
      {/* (5) Dòng <p> chứng minh component trả nhiều node nhờ fragment */}
      <p>Edit src/App.tsx và xem HMR cập nhật không reload trang.</p>
    </>
  );
}

// (6) Tìm node DOM #root trong index.html — nơi React "neo" toàn bộ app.
// Dấu "!" là non-null assertion của TS: cam kết #root chắc chắn tồn tại.
createRoot(document.getElementById("root")!).render(
  // (7) StrictMode bọc ngoài: ở dev React render 2 lần để lộ effect thiếu cleanup.
  // Ở prod StrictMode không làm gì, không làm chậm app.
  <StrictMode>
    <App />
  </StrictMode>
);

export default App; // (8) Default export để main.tsx/App.tsx import gọn: import App from "./App"
