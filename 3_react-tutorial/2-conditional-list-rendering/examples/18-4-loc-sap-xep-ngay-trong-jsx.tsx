// ❌ SAI: return dài, khó đặt tên, khó debug
return <ul>{todos.filter((t) => !t.done).sort((a, b) => a.id - b.id).map((t) => <li key={t.id}>{t.text}</li>)}</ul>;
