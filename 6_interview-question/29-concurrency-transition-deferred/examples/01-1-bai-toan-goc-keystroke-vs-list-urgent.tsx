// ❌ SAI: 1 state cho cả input lẫn list — mỗi phím = render cả list (giật)
function Search() {
  const [q, setQ] = useState("");
  const filtered = DATA.filter((d) => d.includes(q)); // 10.000 item, mỗi phím
  return <><input value={q} onChange={(e) => setQ(e.target.value)} />
         <ul>{filtered.map((s) => <li key={s}>{s}</li>)}</ul></>;
}
