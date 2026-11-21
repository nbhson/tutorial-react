// example.tsx — DAY 16: useLocalStorage + useFetch + useDebounce + useOnlineStatus
// Mục đích: custom hook = hàm use* chia sẻ LOGIC (mỗi nơi state riêng) — khác Service singleton.
import { useEffect, useState } from "react"; // (1) Hook nền để hook custom gọi bên trong

// ── Hook 1: state đồng bộ localStorage (logic dùng ≥2 nơi thì tách) ──────────
function useLocalStorage(key: string, initial = "") {
  // (2) Lazy init: hàm chỉ chạy mount — đọc storage 1 lần, không mỗi render.
  // Vì sao hàm mà không giá trị? Vì localStorage.getItem mỗi render là phí + SSR crash (không có localStorage server).
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(key) ?? initial; } // ?? initial khi chưa có key
    catch { return initial; } // SSR/private-mode không storage vẫn chạy
  });
  // (3) save gói 2 việc (setState + storage) — component không biết chi tiết lưu. Đây là encapsulation kiểu Service.
  const save = (v: string) => {
    setValue(v); // re-render với giá trị mới
    try { localStorage.setItem(key, v); } catch { /* quota/private bỏ qua */ }
  };
  return [value, save] as const; // (4) as const -> tuple [string, (v:string)=>void], không phải mảng chung
}

// ── Hook 2: fetch có hủy (học; prod server state dùng TanStack DAY 12) ───────
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null); // null khi chờ — component hiện "đang tải..."
  const [error, setError] = useState<string | null>(null); // lỗi riêng để hiện, không nuốt
  useEffect(() => {
    const ctrl = new AbortController(); // hủy khi url đổi/unmount — tránh race (cũ về sau ghi đè mới)
    setData(null); setError(null); // reset khi url đổi
    fetch(url, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }) // check ok (DAY 12)
      .then((j: T) => setData(j))
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message)); });
    return () => ctrl.abort();
  }, [url]); // url đổi là fetch lại
  return { data, error }; // (5) Object khi >2 giá trị — tên trường tự tài liệu hơn tuple dài
}

// ── Hook 3: useDebounce — kinh điển search (chỉ gọi API khi ngừng gõ) ────────
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay); // hẹn cập nhật sau delay
    return () => clearTimeout(id); // gõ tiếp là hủy hẹn cũ — chỉ ngừng đủ lâu mới cập nhật
  }, [value, delay]);
  return debounced;
}

// ── Hook 4: useOnlineStatus — đồng bộ sự kiện trình duyệt ────────────────────
function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

export default function App() {
  // (6) Mỗi lần gọi là state RIÊNG — 2 useLocalStorage("name") ở 2 component là 2 bản (không singleton).
  const [name, setName] = useLocalStorage("name");
  const { data: user, error } = useFetch<{ name: string }>("https://jsonplaceholder.typicode.com/users/1");
  const debouncedName = useDebounce(name, 300); // gõ nhanh không gọi gì, ngừng 300ms mới có giá trị tìm
  const online = useOnlineStatus();
  return (
    <>
      <p>Online: {online ? "có mạng" : "mất mạng"}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên (lưu localStorage)" aria-label="Tên" />
      <p>Gõ (debounce 300ms): {debouncedName}</p>
      {/* (7) Ba nhánh data hook: lỗi -> chờ -> có */}
      {error ? <p role="alert">Lỗi API: {error}</p> : <p>API user: {user?.name ?? "đang tải..."}</p>}
    </>
  );
}
