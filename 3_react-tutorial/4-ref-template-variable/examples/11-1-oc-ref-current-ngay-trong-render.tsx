// ❌ SAI: lúc render DOM chưa dựng (hoặc giá trị cũ) — luôn null lần đầu
function App() {
  const r = useRef<HTMLDivElement>(null);
  const h = r.current?.clientHeight; // null
  return <div ref={r}>Hi</div>;
}
