import { useEffect, useState } from "react";

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value); // giá trị đã chốt sau khi ngừng gõ
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay); // hẹn chốt sau delay
    return () => clearTimeout(id); // cleanup: gõ tiếp thì hủy hẹn cũ, chỉ giữ hẹn mới nhất
  }, [value, delay]); // chạy lại mỗi lần gõ hoặc đổi delay
  return debounced;
}

function SearchBox() {
  const [q, setQ] = useState(""); // chữ đang gõ (đổi mỗi phím)
  const settled = useDebounce(q, 300); // chữ đã chốt (đổi khi ngừng gõ 300ms)
  // useEffect(() => { fetch(`/api?q=${settled}`); }, [settled]); // gọi API bằng settled
  return <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ để search..." />;
}
