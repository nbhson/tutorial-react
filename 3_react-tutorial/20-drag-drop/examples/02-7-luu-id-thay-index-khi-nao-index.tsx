import { useState } from "react";

type Item = { id: string; label: string }; // danh tính ổn định, không phải vị trí

function IdList() {
  const [items, setItems] = useState<Item[]>([
    { id: "a", label: "Mục A" }, { id: "b", label: "Mục B" }, { id: "c", label: "Mục C" },
  ]);
  const [dragId, setDragId] = useState<string | null>(null); // lưu id, không lưu index
  const drop = (toId: string) => {
    if (!dragId || dragId === toId) return; // không nguồn hoặc về chỗ cũ -> bỏ qua
    setItems((xs) => {
      const from = xs.findIndex((x) => x.id === dragId); // vị trí tươi lúc thả
      const to = xs.findIndex((x) => x.id === toId); // đích cũng tìm tươi
      const next = [...xs]; // copy bất biến
      const [m] = next.splice(from, 1); // rút ra
      next.splice(to, 0, m); // chèn vào
      return next;
    });
    setDragId(null); // reset nguồn sau thả
  };
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} draggable
          onDragStart={() => setDragId(it.id)} // ghi danh tính nguồn
          onDragOver={(e) => e.preventDefault()} // bắt buộc để cho drop
          onDrop={() => drop(it.id)}>{it.label}</li>
      ))}
    </ul>
  );
}
