// example.tsx: Row thường + MemoRow bọc — nội thất giữ nguyên, thêm "lính gác" ngoài
function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi thật sự render
  return <li>{text}</li>;
}
const MemoRow = memo(Row);
// App có input q: gõ phím nào App cũng render, nhưng MemoRow text không đổi -> memo chặn
<ul>{rows.map((r) => <MemoRow key={r} text={fmtVND.format(r)} />)}</ul>
