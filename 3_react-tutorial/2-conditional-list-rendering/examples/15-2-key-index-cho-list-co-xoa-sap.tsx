// ✅ ĐÚNG: key ổn định — xóa dòng nào, các dòng còn lại giữ đúng state
{todos.map((t) => <li key={t.id}><input defaultValue={t.text} /></li>)}
