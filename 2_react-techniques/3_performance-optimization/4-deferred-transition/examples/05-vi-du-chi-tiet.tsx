// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useDeferredValue, useMemo, useState, useTransition } from 'react';

export function FilterDemo({ items }: { items: string[] }) {
  const [query, setQuery] = useState(''); // value gốc — "sự thật" của input, cập nhật tức thì (urgent)
  const [isPending, startTransition] = useTransition(); // guard update nền — cho badge nhẹ, giữ UI cũ
  const deferred = useDeferredValue(query); // bản "trễ" cho render nặng — list đọc cái này (non-urgent)

  // kết quả lọc dựa trên deferred, KHÔNG phải query gốc — đây là mấu chốt scheduling
  const result = useMemo(
    // so lowercase để tìm không phân biệt hoa thường
    () => items.filter((i) => i.toLowerCase().includes(deferred.toLowerCase())),
    [items, deferred], // deps: items + giá trị trễ — query gốc đổi mà deferred chưa kịp thì không tính lại thừa
  );

  return (
    <div>
      <input
        value={query} // input LUÔN đọc gốc → phản hồi tức thì, gõ không lag
        placeholder="Tìm kiếm…"
        // bọc setQuery trong transition để có isPending; với deferred đơn thuần có thể set thẳng,
        // giữ transition ở đây để micro-feedback "Đang lọc…" mà vẫn giữ UI cũ
        onChange={(e) => startTransition(() => setQuery(e.target.value))}
      />
      {/* pending: báo nhẹ "đang lọc" cho tác vụ nền — KHÔNG early-return trắng */}
      {isPending && <p>Đang lọc…</p>}
      <p>{result.length} kết quả</p> {/* đếm theo kết quả trễ — chậm hơn input 1 nhịp là đúng */}
      <ul>{result.slice(0, 50).map((r) => <li key={r}>{r}</li>)}</ul>
      {/* chỉ hiện 50 dòng: filter 100k vẫn đắt ở khâu tính, render 50 thì nhẹ */}
      {/* list thực sự lớn: kết hợp thêm virtualize (bài 2) — deferred không thay virtualization */}
    </div>
  );
}
