import { create } from 'zustand';

type User = { id: number; name: string };
type UserState = {
  users: User[];
  loading: boolean; // cờ tải trong store — UI switch theo
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
    set({ loading: true, error: null }); // reset lỗi cũ như mẫu thunk
    try {
      const r = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5');
      if (!r.ok) throw new Error('Fetch failed');
      set({ users: await r.json(), loading: false });
    } catch (e) {
      set({ error: String(e), loading: false }); // lỗi: cờ failed + message
    }
  },
  renameOptimistic: async (id, name) => {
    const prev = get().users; // snapshot để rollback
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

// Component: const { users, loading, error, fetchUsers } = useUsers(useShallow(...)) —
// gọi fetchUsers() trong useEffect; nhánh loading/error/list như thường.
