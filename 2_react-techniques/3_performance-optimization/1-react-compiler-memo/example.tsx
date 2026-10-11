import { memo, useMemo, useState } from 'react';

type Item = { id: number; name: string };

// Chỉ re-render khi item đổi (so sánh shallow props)
export const Row = memo(function Row({ item }: { item: Item }) {
  console.log('render row', item.id);
  return <li>{item.name}</li>;
});

export function List({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const visible = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter],
  );
  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Lọc…"
      />
      <ul>
        {visible.map((i) => (
          <Row key={i.id} item={i} />
        ))}
      </ul>
    </div>
  );
}
