// example.tsx — DAY 20: HTML5 drag native tối giản (học cơ chế; prod dùng dnd-kit)
import { useState } from "react";

export default function App() {
  const [items, setItems] = useState(["Mục A", "Mục B", "Mục C"]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const drop = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    setItems((xs) => {
      const next = [...xs];
      const [m] = next.splice(dragIdx, 1);
      next.splice(to, 0, m);
      return next;
    });
    setDragIdx(null);
  };

  return (
    <ul>
      {items.map((it, i) => (
        <li
          key={it}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop(i)}
          style={{ padding: 8, margin: 4, border: "1px solid #999", cursor: "grab" }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}
