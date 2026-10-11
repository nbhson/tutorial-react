# Async Actions — Gọi API trong store

> Nguồn: https://zustand.docs.pmnd.rs/guides/async-actions

## Mục tiêu
- Viết action async (fetch rồi `set`) với cờ `loading`/`error`.
- Biết optimistic update tay + rollback; biết khi nào dừng (chuyển Query).

## Khái niệm cốt lõi
- **Action async = hàm async trong store**: `fetch: async () => { set({ loading: true }); ... set({ data }) }` — không cần thunk/middleware, async/await thuần.
- **Cờ loading/error trong state**: UI switch 3 nhánh như mẫu thunk (track Redux bài 2) — đừng dùng biến ngoài store (mất re-render).
- **Optimistic tay**: `set` dữ liệu đoán trước → gọi API → lỗi thì `set` rollback snapshot đã lưu. Query làm sẵn (`onMutate`); Zustand làm tay khi cần.
- **Giới hạn**: cache theo key, dedupe, retry, staleTime — Zustand không có. API cần các thứ đó → TanStack Query (bài 3), store chỉ giữ kết quả cuối.
- **`get()` trong action**: đọc state mới nhất trước khi set tiếp (vd kiểm tra đang loading thì skip — chống double-fetch).

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `get().loading` guard đầu action — rẻ hơn `condition` của thunk nhưng cùng mục đích chống trùng.
- `prev` chụp **trước** `set` optimistic — rollback trả đúng mảng cũ (tham chiếu cũ, selector mảng đứng yên tiếp).
- `PATCH` JSONPlaceholder không lưu thật — demo flow optimistic vẫn đạt: UI hiện ngay, lỗi thì về cũ.
- Action async không trả data về component (trừ khi cần) — component đọc qua selector sau khi `set` xong.

## Lỗi thường gặp
- **Quên reset `loading` trong catch** → spinner kẹt mãi. Fix: `finally` hoặc set đủ 2 nhánh.
- **Optimistic không rollback** → lỗi mạng mà UI vẫn hiện đồ giả. Fix: luôn chụp snapshot trước, catch trả về.
- **Nhét cache/dedupe/retry vào store** → viết lại Query dở hơn. Fix: fetch nghiêm túc thì Query; store giữ kết quả + cờ UI.
- **Race 2 fetch** (gõ search) → response cũ ghi đè. Fix: AbortController trong action, hoặc debounce query ở component (DAY 16).

## Reference
- [Zustand — Async actions](https://zustand.docs.pmnd.rs/guides/async-actions)
