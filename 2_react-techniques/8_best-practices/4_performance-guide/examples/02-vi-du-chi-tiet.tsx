// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Checklist thu nhỏ: memo item + deferred query + useMemo lọc — 3 lớp re-render trong một file
import { memo, useDeferredValue, useMemo, useState } from 'react';

// Item memo: chỉ render lại khi `v` đổi — list 100+ không phải render theo từng lần gõ
// Vì sao memo ở đây: FastFilter re-render mỗi phím; không memo thì 100 Item vẽ lại dù chữ không đổi
export const Item = memo(function Item({ v }: { v: string }) {
  return <li>{v}</li>;
});

export function FastFilter({ data }: { data: string[] }) {
  const [q, setQ] = useState('');
  // Giữ ô input phản hồi ngay (đọc q gốc); kết quả lọc hoãn theo dq (đọc trễ) khi gõ nhanh
  // Vì sao deferred: filter hàng nghìn + render là non-urgent — hoãn để gõ không lag (INP thấp)
  const dq = useDeferredValue(q);

  // useMemo: tránh tính lại filter khi component render vì lý do khác (cha vẽ lại) mà dq chưa đổi
  const visible = useMemo(
    () => data.filter((d) => d.toLowerCase().includes(dq.toLowerCase())).slice(0, 100),
    [data, dq], // deps data + trễ — q gốc đổi mà dq chưa kịp thì không tính thừa
  );

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc nhanh…" />
      <ul>
        {visible.map((v) => (
          <Item key={v} v={v} /> // key ổn định + memo → Item nào v không đổi thì bỏ qua
        ))}
      </ul>
    </div>
  );
}
