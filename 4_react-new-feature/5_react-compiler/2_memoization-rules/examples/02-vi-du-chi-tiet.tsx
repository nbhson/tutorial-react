'use memo'; // Bật compiler cho file này

// ✅ GOOD: render THUẦN — Compiler tự memo `sorted` và callback.
export function GoodList({
  items,
  onPick,
}: {
  items: string[];
  onPick: (v: string) => void;
}) {
  // Copy rồi sort ⇒ KHÔNG mutate props `items`.
  // Compiler nhận ra `sorted` chỉ phụ thuộc `items`.
  const sorted = [...items].sort();

  return (
    <ul>
      {sorted.map((item) => (
        <li key={item}>
          {/* Callback inline vẫn ổn: compiler giữ identity ổn định khi cần */}
          <button onClick={() => onPick(item)}>{item}</button>
        </li>
      ))}
    </ul>
  );
}

// ❌ BAD: mutate props trong render ⇒ Compiler SKIP + lint báo lỗi.
// Sửa: const next = [...items, 'x'] rồi render từ `next`.
export function BadCounter({ items }: { items: string[] }) {
  // @ts-expect-error — minh họa vi phạm Rules of React
  items.push('mutated'); // vi phạm: mutate render input
  return <p>Tổng: {items.length}</p>;
}

// ✅ Vẫn giữ useMemo cho tính toán ĐẮT (compiler không thay việc này về semantic).
export function HeavyStats({ rows }: { rows: number[] }) {
  const stats = (() => {
    // Giả lập tính nặng trên mảng rows lớn
    return { sum: rows.reduce((a, b) => a + b, 0) };
  })();
  return <p>Tổng: {stats.sum}</p>;
}
