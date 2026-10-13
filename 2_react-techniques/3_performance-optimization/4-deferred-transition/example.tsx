import { useDeferredValue, useMemo, useState, useTransition } from 'react';

export function FilterDemo({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferred = useDeferredValue(query);

  const result = useMemo(
    () => items.filter((i) => i.toLowerCase().includes(deferred.toLowerCase())),
    [items, deferred],
  );

  return (
    <div>
      <input
        value={query}
        placeholder="Tìm kiếm…"
        onChange={(e) => startTransition(() => setQuery(e.target.value))}
      />
      {isPending && <p>Đang lọc…</p>}
      <p>{result.length} kết quả</p>
      <ul>{result.slice(0, 50).map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}
