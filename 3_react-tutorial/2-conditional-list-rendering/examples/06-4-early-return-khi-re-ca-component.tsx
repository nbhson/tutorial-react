// example.tsx: chặn ngay khi chưa đăng nhập
if (!isLogin) return <p>Vui lòng đăng nhập.</p>;
// Mọi dòng sau (filter, map) chỉ chạy khi đã login — phẳng, không lồng
const pending = TODOS.filter((t) => !t.done);
return <ul>...</ul>;
