// example.tsx — Concurrent + createRoot (React 18)
import { createRoot } from 'react-dom/client';
import { StrictMode, useState } from 'react';

// Entry point React 18: createRoot thay ReactDOM.render
const el = document.getElementById('root')!;
const root = createRoot(el); // tạo root MỘT LẦN, tái sử dụng cho mọi render sau

const ITEMS = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);

function App() {
  const [query, setQuery] = useState('');

  // Render nặng: filter 5000 phần tử ngay trong render.
  // Với renderer legacy (17) mỗi keystroke chạy khối này đồng bộ → input giật.
  // Với concurrent renderer: React có thể NGẮT render này để xử lý keystroke,
  // rồi quay lại hoàn tất lọc khi rảnh → gõ phím luôn mượt.
  const filtered = ITEMS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <h2>Concurrent + createRoot (React 18)</h2>
      <input
        value={query}                    // value controlled
        onChange={(e) => setQuery(e.target.value)} // keystroke = urgent update
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
  <StrictMode>   {/* dev: double-invoke render/effect để lộ side-effect không an toàn */}
    <App />
  </StrictMode>,
);
