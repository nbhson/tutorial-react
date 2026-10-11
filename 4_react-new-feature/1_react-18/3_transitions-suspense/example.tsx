import { Suspense, useState, useTransition } from 'react';

const ITEMS = Array.from({ length: 5000 }, (_, i) => `Product ${i + 1}`);

function Results({ query }: { query: string }) {
  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <ul>
      {filtered.slice(0, 50).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TransitionDemo() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    setInput(value); // urgent: input hiển thị ngay
    startTransition(() => {
      setQuery(value); // non-urgent: lọc list nền
    });
  }

  return (
    <div>
      <h2>Transitions + Suspense (React 18)</h2>
      <input
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tìm kiếm..."
      />
      {isPending && <p>Đang lọc...</p>}
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <Suspense fallback={<p>Đang tải kết quả...</p>}>
          <Results query={query} />
        </Suspense>
      </div>
    </div>
  );
}
