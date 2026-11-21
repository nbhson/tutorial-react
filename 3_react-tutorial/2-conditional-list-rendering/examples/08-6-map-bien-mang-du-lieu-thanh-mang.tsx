// Hai bước độc lập: filter giảm số node, map tạo node — tách ra dễ đọc/test
const pending = TODOS.filter((t) => !t.done); // bước 1: lọc (JS thuần)
return <ul>{pending.map((t) => <li key={t.id}>{t.text}</li>)}</ul>; // bước 2: vẽ
