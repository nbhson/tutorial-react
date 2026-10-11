// example.tsx — DAY 2: conditional + list (JS thuần thay *ngIf/*ngFor)
// Mục đích: chứng minh React không cần directive — rẽ nhánh và lặp đều là JS
// trên giá trị JSX. key ổn định là identity cho reconciliation.
type Todo = { id: number; text: string; done: boolean }; // (1) Type item — id ổn định làm key

// (2) Dữ liệu tĩnh demo: 1 việc xong + 2 việc chưa xong để filter có cái lọc
const TODOS: Todo[] = [
  { id: 1, text: "Hoc JSX", done: true },
  { id: 2, text: "Hoc hooks", done: false },
  { id: 3, text: "Build Vite app", done: false },
];

// (3) Prop isLogin default true — minh họa early return khi chưa đăng nhập
export default function App({ isLogin = true }: { isLogin?: boolean }) {
  // (4) Early return: chặn toàn bộ render nếu chưa đăng nhập — sạch hơn ternary lồng.
  // Phần code sau return chỉ chạy khi đã vượt qua điều kiện này.
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>;

  // (5) Lọc trước khi render: logic là JS trên đầu hàm, JSX ở dưới chỉ "vẽ".
  // pending chỉ chứa việc chưa xong — tách filter khỏi map để dễ đọc/test.
  const pending = TODOS.filter((t) => !t.done);

  return (
    <ul>
      {/* (6) Ternary đủ 2 nhánh: rỗng -> báo hoàn thành; có dữ liệu -> map ra <li> */}
      {/* Vì sao ternary mà không phải 2x &&? Vì cả 2 nhánh đều có nội dung cần hiện. */}
      {pending.length === 0 ? (
        <li>Hoàn thành tất cả!</li>
      ) : (
        /* (7) .map() biến mảng dữ liệu -> mảng JSX; key={t.id} ổn định để React diff đúng. */
        /* Vì sao không key={index}? Vì thêm/xóa giữa list làm index dịch -> state nhảy sai chỗ. */
        pending.map((t) => <li key={t.id}>{t.text}</li>)
      )}
      {/* (8) Pattern && cho nhánh "có/không": chỉ hiện khi đúng, không có nhánh else */}
      {/* So sánh > 0 trả boolean — tránh in "0" khi dùng {pending.length && ...} */}
      {pending.length > 0 && <li>Bạn còn {pending.length} việc</li>}
    </ul>
  );
}
