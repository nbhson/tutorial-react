// ✅ (Q10, Q27) — WebSocket (1 component leaf dùng (Q10, Q27)
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const ws = new WebSocket("wss://.../time");
    ws.onmessage = (e) => setNow(new Date(JSON.parse(e.data).ts)); // Mỗi tick → set state (leaf (Q10)
    return () => ws.close();
  }, []);
  return <span>{now.toLocaleTimeString()}</span>;
}
// Chỉ (LiveClock re-render (Q10, Q27) (không (cha (Q30 cascade) (Q30)
// (Q10, Q27) "đúng (1 component (Q10, Q27) — "sai (nhiều component (Q9, Q13) (Q9, Q13)
