// example.tsx — DAY 16: useLocalStorage + useFetch
import { useEffect, useState } from "react";

function useLocalStorage(key: string, initial = "") {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  const save = (v: string) => {
    setValue(v);
    localStorage.setItem(key, v);
  };
  return [value, save] as const;
}

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then(setData);
    return () => ctrl.abort();
  }, [url]);
  return data;
}

export default function App() {
  const [name, setName] = useLocalStorage("name");
  const user = useFetch<{ name: string }>("https://jsonplaceholder.typicode.com/users/1");
  return (
    <>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên (lưu localStorage)" />
      <p>API user: {user?.name ?? "đang tải..."}</p>
    </>
  );
}
