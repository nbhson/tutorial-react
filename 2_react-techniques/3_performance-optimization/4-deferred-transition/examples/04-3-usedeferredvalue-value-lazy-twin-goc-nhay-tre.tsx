// ❌ SAI: input đọc deferred — gõ trễ, ngược đời
<input value={deferred} onChange={(e) => setQuery(e.target.value)} />
// ✅ ĐÚNG: input gốc, list trễ
<input value={query} onChange={(e) => setQuery(e.target.value)} />
<ul>{locTheo(deferred)}</ul>
