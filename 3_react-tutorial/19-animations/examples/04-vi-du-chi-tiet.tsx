// example.tsx — DAY 19: CSS transition + Tailwind + reduced-motion + Motion ý tưởng
// Mục đích: animation = state đổi -> style/class đổi -> CSS nội suy. Motion chỉ khi cần exit/layout.
import { useState } from "react"; // (1) State open là nguồn duy nhất — đổi là transition chạy, không JS frame tay

export default function App() {
  const [open, setOpen] = useState(false); // (2) false = ẩn (opacity 0 + trượt 8px + chặn click)
  const [scale, setScale] = useState(false); // (3) Demo scale + fade bài tập — transform + opacity đều GPU rẻ

  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Toggle fade/slide</button>{" "}
      <button onClick={() => setScale((s) => !s)}>Toggle scale/fade</button>
      {/* (4) Khối fade/slide: GIÁ TRỊ đổi theo state, transition KHAI CỐ ĐỊNH (không trong nhánh). */}
      {/* Vì sao transition cố định? Vì khai trong nhánh là lần có lần không — mất mượt. */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ccc",
          // (5) opacity + transform là 2 thuộc tính GPU rẻ nhất (không reflow như width/margin/top).
          opacity: open ? 1 : 0, // đổi giữa 2 render là trình duyệt nội suy 200ms
          transform: open ? "translateY(0)" : "translateY(8px)", // trượt nhẹ, không dùng margin/top
          transition: "opacity 200ms, transform 200ms", // khai "nội suy gì, bao lâu" — cố định ngoài điều kiện
          // (6) Ẩn nhưng vẫn DOM (để transition 2 chiều) -> chặn click khi ẩn. Quên là khối vô hình chặn nút dưới.
          pointerEvents: open ? "auto" : "none",
        }}
      >
        Nội dung fade/slide
      </div>
      {/* (7) Tailwind tương đương: class đổi theo state, transition utility cố định */}
      <div
        className={open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
        style={{ transition: "opacity 200ms, transform 200ms", marginTop: 12, padding: 12, border: "1px solid #ccc" }}
      >
        Bản Tailwind — cùng cơ chế, khác công cụ
      </div>
      {/* (8) Scale + fade bài tập: scale(0.95)<->1 kèm opacity — vẫn transform + opacity rẻ */}
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", opacity: scale ? 1 : 0, transform: scale ? "scale(1)" : "scale(0.95)", transition: "opacity 200ms, transform 200ms", pointerEvents: scale ? "auto" : "none" }}>
        Scale + fade
      </div>
      {/* (9) reduced-motion: CSS toàn cục (xem README) tắt transition khi user yêu cầu — nội dung vẫn đúng, chỉ không mượt. */}
      {/* Motion khi cần exit/layout (không chạy ở đây, xem README): AnimatePresence + exit + layout. */}
    </>
  );
}
