// ❌ KHÔNG an toàn — StrictMode (và concurrent) làm lộ ngay:
function Search() {
  const [id] = useState(() => Math.random()); // initializer chạy 2 lần ở dev → ID lệch
  useEffect(() => {
    const sub = subscribe(store);       // mount chạy 2 lần → 2 subscription
    // không có cleanup → state lệch, memory leak
  }, []);
  return <p>id: {id}</p>;
}

// ✅ An toàn — StrictMode "không còn phàn nàn" (đặt import ở đầu file thật):
function Search() {
  const id = useId(); // import { useId } từ "react" — ID tất định (React 18), không random
  useEffect(() => {
    const sub = subscribe(store);
    return () => sub.unsubscribe();       // cleanup đúng → double-mount không hại gì
  }, []);
  return <p>id: {id}</p>;
}
