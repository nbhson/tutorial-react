// example.tsx — DAY 20: native DnD (học) + id ổn định + highlight + nút a11y + dnd-kit ý tưởng
// Mục đích: kéo thả = setState mảng bất biến khi drop; prod dùng dnd-kit (touch/keyboard).
import { useState } from "react"; // (1) items (thứ tự) + dragId (nguồn) + overId (highlight đích)

type Item = { id: string; label: string }; // (2) id ỔN ĐỊNH làm key + định danh kéo (không index — index dịch khi list đổi giữa lúc kéo)

const INITIAL: Item[] = [ // (3) Dữ liệu id ổn định — key={it.id} để reorder giữ đúng state (DAY 2)
  { id: "a", label: "Mục A" },
  { id: "b", label: "Mục B" },
  { id: "c", label: "Mục C" },
];

// (4) Hàm thuần hoán vị — dễ test (DAY 21), tái dùng cho nút Lên/Xuống (a11y) + dnd-kit onDragEnd.
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list; // no-op thả về chỗ cũ
  const next = [...list]; // bất biến: copy, không splice gốc (splice gốc là mutate state)
  const [m] = next.splice(from, 1); // rút khỏi cũ
  next.splice(to, 0, m); // chèn vào mới — chính là arrayMove của dnd-kit
  return next;
}

export default function App() {
  const [items, setItems] = useState(INITIAL);
  const [dragId, setDragId] = useState<string | null>(null); // (5) Nguồn là id (không index) — an toàn khi mảng đổi giữa lúc kéo
  const [overId, setOverId] = useState<string | null>(null); // (6) Đích để highlight khi kéo qua (onDragEnter/Leave)

  const dropOn = (toId: string) => {
    // (7) No-op khi không nguồn hoặc về chỗ cũ — không setState thừa
    if (dragId === null || dragId === toId) { setOverId(null); return; }
    setItems((xs) => {
      const from = xs.findIndex((x) => x.id === dragId); // tìm index lúc drop (không tin index lúc drag)
      const to = xs.findIndex((x) => x.id === toId);
      if (from === -1 || to === -1) return xs;
      return move(xs, from, to); // mảng mới -> React re-render thứ tự mới, không đụng DOM tay
    });
    setDragId(null); setOverId(null); // (8) Reset nguồn/highlight sau drop
  };

  // (9) Phương án không kéo (a11y + test ổn định): nút Lên/Xuống dùng chung move().
  const step = (id: string, dir: -1 | 1) => {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= xs.length) return xs;
      return move(xs, i, j);
    });
  };

  return (
    <ul>
      {items.map((it) => (
        <li
          key={it.id} // (10) Key ổn định — KHÔNG key={index} (reorder là index dịch, state nhảy sai)
          draggable // (11) Bật kéo HTML5 — không có là drag không bắt đầu
          onDragStart={() => setDragId(it.id)} // (12) Ghi nguồn là id (dataTransfer string cũng được nhưng id state gọn demo)
          onDragEnter={() => setOverId(it.id)} // highlight đích khi kéo qua
          onDragLeave={() => setOverId((o) => (o === it.id ? null : o))}
          onDragOver={(e) => e.preventDefault()} // (13) BẮT BUỘC: mặc định trình duyệt từ chối drop; không gọi là onDrop không chạy (pitfall #1)
          onDrop={() => dropOn(it.id)} // (14) Thả là setState mảng mới (bất biến), React vẽ thứ tự mới
          onDragEnd={() => { setDragId(null); setOverId(null); }} // thả ra ngoài (over null) cũng reset
          style={{
            padding: 8, margin: 4, border: "1px solid #999", cursor: "grab",
            background: overId === it.id ? "#e3f2fd" : "#fff", // highlight đích
            opacity: dragId === it.id ? 0.5 : 1, // mờ nguồn đang kéo
          }}
        >
          {it.label}
          {/* (15) Nút a11y: keyboard/screen reader + test ổn định hơn kéo */}
          <button onClick={() => step(it.id, -1)} aria-label={`Di chuyển ${it.label} lên`}>↑</button>
          <button onClick={() => step(it.id, 1)} aria-label={`Di chuyển ${it.label} xuống`}>↓</button>
        </li>
      ))}
    </ul>
  );
}

// Ghi chú dnd-kit prod (xem README copy):
// DndContext + SortableContext + useSortable({ id }) -> attributes/listeners/setNodeRef/transform +
// arrayMove(items, from, to) trong onDragEnd({ active, over }) + DragOverlay preview +
// keyboard sensor (Space nhấc, arrows di, Space thả) + activationConstraint (tránh kéo nhầm khi click nút trong).
