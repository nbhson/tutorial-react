// ❌ SAI: query ở App — gõ phím vẽ cả App (Sidebar/Header vô can cũng vẽ)
function App() { const [q, setQ] = useState(''); return <><Header /><List q={q} /></>; }
// ✅ ĐÚNG: query ở List — gõ chỉ List vẽ
function App() { return <><Header /><List /></>; }
function List() { const [q, setQ] = useState(''); /* ... */ }
