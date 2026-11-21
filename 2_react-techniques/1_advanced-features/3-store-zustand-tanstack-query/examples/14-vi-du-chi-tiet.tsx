// ---------- Zustand: client state ----------
// Vì sao tách: sidebar là trạng thái phiên UI — không cần cache, retry, invalidate
import { create } from 'zustand';

// Kiểu store: state + action trong cùng type — đọc một nơi hiểu hết
type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false, // giá trị khởi đầu: sidebar đóng
  // set((s) => ...) dùng state hiện tại — an toàn cả khi gọi nhiều lần liên tiếp
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// ---------- TanStack Query: server state ----------
// Vì sao tách: user từ API cần cache theo id, retry, dedupe — Query làm sẵn
import { useQuery } from '@tanstack/react-query';

export function UserCard({ id }: { id: number }) {
  // queryKey ['users', id]: mỗi id một cache riêng — không ghi đè nhau
  const { data, isPending, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((r) => {
        // ném lỗi để Query biết đây là lỗi fetch → tự retry theo cấu hình
        if (!r.ok) throw new Error('Fetch failed');
        return r.json();
      }),
  });
  // selector chọn đúng 1 action cần — đổi field khác không re-render UserCard
  // Vì sao hẹp: Object.is so sánh kết quả selector — function toggle ổn định nên không render thừa
  const toggle = useUi((s) => s.toggle);
  if (isPending) return <p>Đang tải…</p>; // lần đầu chưa có cache → skeleton trắng
  if (isError) return <p>Lỗi tải user.</p>; // fetch lỗi sau retry → báo lỗi
  return (
    <div>
      <h3>{data.name}</h3>
      <button onClick={toggle}>Đóng/mở sidebar</button>
    </div>
  );
}
