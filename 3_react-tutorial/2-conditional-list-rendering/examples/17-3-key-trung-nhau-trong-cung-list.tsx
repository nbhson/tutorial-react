// ✅ ĐÚNG: key theo id unique; không có id thì sinh khi nhận data
{todos.map((t) => <li key={t.id}>{t.text}</li>)}
// Hoặc: const withId = data.map((t) => ({ ...t, _key: crypto.randomUUID() }));
