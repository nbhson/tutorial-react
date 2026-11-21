import { useDeferredValue } from "react";

function Search() {
  const [q, setQ] = useState("");              // 1 state (input đọc q gốc)
  const dq = useDeferredValue(q);              // dq = "bản trễ" (list đọc dq)
  const filtered = DATA.filter((d) => d.includes(dq.toLowerCase()));
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      {q !== dq && <p>Đang lọc…</p>}           // so q gốc vs bản trễ (giữa chừng)
      <ul>{filtered.slice(0, 100).map((s) => <li key={s}>{s}</li>)}</ul>
    </>
  );
}
