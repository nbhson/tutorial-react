import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';

type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false,
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

export function UserCard({ id }: { id: number }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((r) => {
        if (!r.ok) throw new Error('Fetch failed');
        return r.json();
      }),
  });
  const toggle = useUi((s) => s.toggle);
  if (isPending) return <p>Đang tải…</p>;
  if (isError) return <p>Lỗi tải user.</p>;
  return (
    <div>
      <h3>{data.name}</h3>
      <button onClick={toggle}>Đóng/mở sidebar</button>
    </div>
  );
}
