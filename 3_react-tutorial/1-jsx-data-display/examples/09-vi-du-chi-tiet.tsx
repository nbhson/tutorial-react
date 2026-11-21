// example.tsx — DAY 1: JSX data display (controlled input + các kiểu binding)
// Mục đích: chứng minh JSX chỉ là JS expression — mọi dữ liệu TS vào JSX qua {},
// mọi sự kiện ra qua props on*. Không có ngModel 2 chiều tự động.
import { useState } from "react"; // (1) Import hook giữ state — input controlled đọc/ghi qua state này

type User = { name: string; age: number }; // (2) Type "hợp đồng" dữ liệu — IDE gợi ý, TS chặn sai kiểu

export default function App() {
  // (3) Dữ liệu tĩnh demo: object user — minh họa {user.age + 1} tính ngay trong JSX
  const user: User = { name: "Son Nguyen", age: 30 };
  // (4) State "name": single source of truth — <h3>, <input>, alert đều đọc từ đây.
  // Vì sao cần state mà không dùng biến thường? Vì setName mới báo React vẽ lại.
  const [name, setName] = useState(user.name);
  // (5) State phụ để minh họa class/style động theo boolean
  const [isActive, setIsActive] = useState(true);

  return (
    // (6) Fragment gom nhiều element mà không thêm <div> thừa (tương đương ng-container)
    <>
      {/* (7) Interpolation: {name} đọc state — mỗi lần setName, đúng dòng này cập nhật */}
      <h3>Your name: {name}</h3>
      {/* (8) Mọi biểu thức JS đều hợp lệ trong {}: phép cộng, gọi hàm, ternary */}
      <p>Next year: {user.age + 1}</p>
      {/* (9) Attribute binding: src={...} thay cho [src]="..." của Angular */}
      <img src="https://picsum.photos/120" alt={name} width={120} />
      {/* (10) Class/style động: className + object camelCase — tương đương [class.active]/[style.color] */}
      <div className={isActive ? "active" : ""} style={{ color: isActive ? "green" : "red" }}>
        Trạng thái: {isActive ? "Đang hoạt động" : "Tạm nghỉ"}
      </div>
      <button onClick={() => setIsActive((a) => !a)}>Đảo trạng thái</button>
      {/* (11) Controlled input: value đọc state + onChange ghi ngược state — thay [(ngModel)] */}
      {/* e là React.ChangeEvent<HTMLInputElement>, e.target.value là text vừa gõ */}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gõ tên..." />
      {/* (12) Event binding: truyền THAM CHIẾU hàm via arrow — KHÔNG gọi ngay lúc render */}
      {/* Vì sao bọc arrow? Để click mới gọi alert với name mới nhất từ closure render hiện tại */}
      <button onClick={() => alert(`Hello ${name}`)}>Click me!</button>
    </>
  );
}
