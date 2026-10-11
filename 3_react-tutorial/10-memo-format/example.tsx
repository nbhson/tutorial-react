// example.tsx — DAY 10: memo bọc component + format
import { memo, useMemo, useState } from "react";

const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

// 1. Component thường — viết như mọi khi, không biết gì về memo
function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi thật sự render lại
  return <li>{text}</li>;
}

// 2. Bọc ngoài bằng memo — thêm "lính gác" so props, nội thất giữ nguyên
const MemoRow = memo(Row);

export default function App() {
  const [q, setQ] = useState(""); // gõ phím nào App cũng render lại
  const rows = [120000, 45000, 89000];
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ để App render lại" />
      <ul>{rows.map((r) => <MemoRow key={r} text={fmtVND.format(r)} />)}</ul>
      <p>Tổng: {fmtVND.format(total)}</p>
    </>
  );
}
// Thử nghiệm: gõ vào ô input — App render lại nhưng console KHÔNG in thêm
// "Row render" (text không đổi nên memo chặn). Xóa memo (dùng Row thường)
// rồi gõ lại — console in 3 dòng mỗi phím, thấy ngay tác dụng của lớp bọc.
