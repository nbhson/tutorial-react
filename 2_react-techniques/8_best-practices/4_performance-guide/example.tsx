import { memo, useDeferredValue, useMemo, useState } from 'react';

// Checklist thu nhỏ: memo item + deferred query + useMemo lọc
export const Item = memo(function Item({ v }: { v: string }) {
  return <li>{v}</li>;
});

export function FastFilter({ data }: { data: string[] }) {
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const visible = useMemo(
    () => data.filter((d) => d.toLowerCase().includes(dq.toLowerCase())).slice(0, 100),
    [data, dq],
  );
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc nhanh…" />
      <ul>
        {visible.map((v) => (
          <Item key={v} v={v} />
        ))}
      </ul>
    </div>
  );
}
