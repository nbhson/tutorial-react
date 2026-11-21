// ✅ ĐÚNG: input đọc query gốc (nhạy), list đọc deferred (trễ) — gõ không lag
const [query, setQuery] = useState('');
const deferred = useDeferredValue(query); // bản trễ cho render nặng
<input value={query} onChange={(e) => setQuery(e.target.value)} /> {/* urgent */}
<ul>{items.filter((i) => i.includes(deferred)).slice(0, 50).map((r) => <li key={r}>{r}</li>)}</ul>
