'use memo';

// ✅ GOOD: pure render — Compiler tự memo sorted + callback.
export function GoodList({ items, onPick }: { items: string[]; onPick: (v: string) => void }) {
  const sorted = [...items].sort(); // copy, không mutate props
  return (
    <ul>
      {sorted.map((item) => (
        <li key={item}>
          <button onClick={() => onPick(item)}>{item}</button>
        </li>
      ))}
    </ul>
  );
}

// ❌ BAD: mutate props trong render — Compiler SKIP + lint báo lỗi.
// Sửa: const next = [...items, 'x'] rồi render next.
export function BadCounter({ items }: { items: string[] }) {
  // @ts-expect-error — minh họa vi phạm Rules of React
  items.push('mutated'); // vi phạm: mutate render input
  return <p>Tổng: {items.length}</p>;
}

// ✅ Giữ useMemo cho tính toán ĐẮT (Compiler không thay việc này về mặt semantic):
export function HeavyStats({ rows }: { rows: number[] }) {
  const stats = (() => {
    // giả lập tính nặng trên rows lớn
    return { sum: rows.reduce((a, b) => a + b, 0) };
  })();
  return <p>Tổng: {stats.sum}</p>;
}
