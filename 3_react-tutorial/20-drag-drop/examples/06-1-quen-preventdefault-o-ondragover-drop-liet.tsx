// ✅ ĐÚNG: luôn preventDefault để cho drop (như example)
<li onDragStart={...} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)}>{it}</li>
// dnd-kit không cần (tự lo va chạm) — 1 lý do chuyển prod
