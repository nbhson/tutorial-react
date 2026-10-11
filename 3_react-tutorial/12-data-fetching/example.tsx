// example.tsx — DAY 12: fetch + useEffect + AbortController
import { useEffect, useState } from "react";

type User = { id: number; name: string };

export default function App() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("https://jsonplaceholder.typicode.com/users", { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e)); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
