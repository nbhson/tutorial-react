// example.tsx — DAY 12: fetch manual (học cơ chế) + TanStack/mutation ghi chú
// Mục đích: nắm contract AbortController/cleanup/loading-error trước khi dùng lib.
import { useEffect, useState } from "react"; // (1) Effect cho fetch sau mount, state cho 3 nhánh

type User = { id: number; name: string }; // (2) Shape data — query lib cũng suy từ queryFn

export default function App({ url = "https://jsonplaceholder.typicode.com/users" }: { url?: string }) {
  // (3) Ba state cho 3 nhánh UI: data rỗng ban đầu, loading true, error null.
  // TanStack gộp thành { data, isLoading/isPending, error } — cùng ý.
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController(); // (4) Bộ hủy: signal nối vào fetch, abort() hủy khi unmount/url đổi
    setLoading(true); setError(null); // (5) Reset khi url đổi (deps [url]) — query lib làm tự động
    fetch(url, { signal: ctrl.signal })
      // (6) fetch chỉ reject khi mạng; HTTP 404/500 vẫn resolve -> PHẢI check r.ok tay
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`); return r.json(); })
      .then((json: User[]) => setData(json)) // (7) Về -> setData -> re-render nhánh data
      // (8) Bỏ qua AbortError (hủy chủ đích vì unmount/StrictMode) — không phải lỗi để hiện
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message ?? e)); })
      .finally(() => setLoading(false)); // (9) Tắt loading cả thành công lẫn lỗi (trừ unmount sớm)
    return () => ctrl.abort(); // (10) Cleanup đối xứng: hủy request khi unmount hoặc url đổi trước khi xong
  }, [url]); // deps [url] — đổi url là fetch lại; TanStack dùng queryKey ["users", url] cho việc này

  // (11) Ba nhánh loại trừ: loading -> error -> data. Thứ tự quan trọng (loading trước).
  if (loading) return <p>Đang tải...</p>;
  if (error) return <p role="alert">Lỗi: {error}</p>;
  if (data.length === 0) return <p>Trống — không có user nào.</p>; // empty state (không có là <ul> rỗng)
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>; // (12) key ổn định theo id
}

// Ghi chú prod (xem README để copy đầy đủ):
// - useQuery({ queryKey: ["users"], queryFn, staleTime: 30_000, retry: 2 }) cho cache/dedupe/retry/refetch.
// - QueryClientProvider ở main.tsx với QueryClient tạo 1 lần (không tạo mỗi render).
// - useMutation + qc.invalidateQueries({ queryKey: ["users"] }) sau thêm/sửa/xóa.
// - queryKey đủ chi tiết (["users", page]) — chung key cho 2 page là sai cache.
