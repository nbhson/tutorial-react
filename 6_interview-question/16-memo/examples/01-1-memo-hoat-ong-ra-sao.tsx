function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi THẬT SỰ render
  return <li>{text}</li>;
}
const MemoRow = memo(Row); // bọc ngoài (không đổi code Row)
