// ❌ SAI: xóa dòng đầu -> input dòng 2 nhảy lên dòng 1
{todos.map((t, i) => <li key={i}><input defaultValue={t.text} /></li>)}
