import { create } from 'zustand';

// State async chuẩn: data + loading + error — UI switch 3 nhánh
type User = { id: number; name: string };
type UserState = {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  renameOptimistic: (id: number, name: string) => Promise<void>;
};
export const useUsers = create<UserState>()((set, get) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    if (get().loading) return; // đang tải thì skip — chống gọi trùng
    set({ loading: true, error: null }); // reset lỗi cũ
    try {
      const r = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5');
      if (!r.ok) throw new Error('Fetch failed');
      set({ users: await r.json(), loading: false }); // xong: data + tắt cờ
    } catch (e) {
      set({ error: String(e), loading: false }); // lỗi: message + tắt cờ
    }
  },
  renameOptimistic: async (id, name) => {
    const prev = get().users; // snapshot để rollback khi lỗi
    set({ users: prev.map((u) => (u.id === id ? { ...u, name } : u)) }); // hiện ngay
    try {
      const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error('Rename failed');
    } catch {
      set({ users: prev }); // lỗi: trả đúng snapshot cũ
    }
  },
}));

// Component (selector nhiều field dùng useShallow như bài 1):
// const { users, loading, error, fetchUsers } = useUsers(useShallow((s) => ({
//   users: s.users, loading: s.loading, error: s.error, fetchUsers: s.fetchUsers,
// })));
// useEffect(() => { fetchUsers(); }, [fetchUsers]); // gọi một lần sau mount
