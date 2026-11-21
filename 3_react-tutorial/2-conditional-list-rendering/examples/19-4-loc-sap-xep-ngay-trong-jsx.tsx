// ✅ ĐÚNG: tính ra biến đặt tên tốt, JSX chỉ vẽ
const pending = todos.filter((t) => !t.done);
const sorted = [...pending].sort((a, b) => a.id - b.id);
return <ul>{sorted.map((t) => <li key={t.id}>{t.text}</li>)}</ul>;
