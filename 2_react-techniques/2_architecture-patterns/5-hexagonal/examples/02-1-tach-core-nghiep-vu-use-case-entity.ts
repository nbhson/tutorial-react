// ❌ SAI: luật lẫn fetch trong component — test phải mock fetch, đổi API sửa view
function DemMo() {
  const [n, setN] = useState(0);
  useEffect(() => { fetch('/api/todos').then((r) => r.json()).then((ts) => setN(ts.filter((t: any) => !t.done).length)); }, []);
  return <p>{n}</p>;
}
// ✅ ĐÚNG: use-case thuần + adapter bơm vào (xem Ví dụ chi tiết)
