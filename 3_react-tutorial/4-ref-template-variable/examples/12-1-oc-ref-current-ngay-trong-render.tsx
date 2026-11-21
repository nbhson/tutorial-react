// ✅ ĐÚNG: đọc trong effect/event — sau khi DOM có
function App() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => { console.log(r.current?.clientHeight); }, []);
  return <div ref={r}>Hi</div>;
}
