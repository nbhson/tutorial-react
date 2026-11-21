// ❌ SAI: đọc ngay trong render — luôn null lần đầu
function App() {
  const r = useRef<HTMLDivElement>(null);
  const h = r.current?.clientHeight; // null — DOM chưa có
  return <div ref={r}>Hi</div>;
}

// ✅ ĐÚNG: đọc trong effect (sau khi DOM dựng) hoặc event
useEffect(() => { console.log(r.current?.clientHeight); }, []);
<button onClick={() => r.current?.focus()}>Focus</button>
