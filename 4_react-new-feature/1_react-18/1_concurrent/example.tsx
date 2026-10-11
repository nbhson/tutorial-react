import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';

// Entry point React 18: createRoot thay ReactDOM.render
const el = document.getElementById('root')!;
const root = createRoot(el);

const ITEMS = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);

function App() {
  const [query, setQuery] = useState('');

  // Render nặng nhưng concurrent renderer không block input:
  // React có thể ngắt render này để xử lý keystroke trước.
  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <h2>Concurrent + createRoot (React 18)</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Gõ để lọc 5000 items..."
      />
      <p>Kết quả: {filtered.length}</p>
      <ul>
        {filtered.slice(0, 100).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
