// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { memo, useMemo, useState } from 'react';

type Item = { id: number; name: string };

// Chỉ re-render khi item đổi (so sánh shallow props)
// Với Compiler bật, memo này gần như là "bảo hiểm" — compiler cũng tự memo;
// giữ lại khi Row nhận props từ ngoài vùng compiler hoặc muốn tường minh ngữ nghĩa.
// Vì sao memo ở đây: List re-render mỗi phím gõ; không memo thì 1.000 Row vẽ lại dù item không đổi.
export const Row = memo(function Row({ item }: { item: Item }) {
  console.log('render row', item.id); // theo dõi để debug re-render — KHÔNG để log ở production
  return <li>{item.name}</li>;
});

export function List({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState(''); // state "nóng": mỗi phím gõ re-render List
  // useMemo chỉ cho việc lọc danh sách (đắt khi 1.000+ phần tử) — deps đầy đủ items + filter
  // Vì sao useMemo: List re-render vì lý do khác (cha vẽ lại) mà filter chưa đổi thì không lọc lại
  const visible = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter], // thiếu deps là stale; thừa deps là tính lại thừa — phải đủ đúng
  );
  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Lọc…"
      />
      <ul>
        {/* Row memo: mỗi lần gõ filter, Row nào không đổi item sẽ bỏ qua render */}
        {/* Vì sao key=id: key ổn định để React + memo nhận đúng Row nào là nào sau lọc */}
        {visible.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </ul>
    </div>
  );
}
