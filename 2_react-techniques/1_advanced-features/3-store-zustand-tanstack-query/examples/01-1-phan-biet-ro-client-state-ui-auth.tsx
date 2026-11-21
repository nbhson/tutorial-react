// ✅ ĐÚNG: mỗi loại state một nơi — không copy server data vào Zustand
import { create } from 'zustand'; // client state: sidebar
import { useQuery } from '@tanstack/react-query'; // server state: user từ API

type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false,
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
// UserCard đọc user từ Query (cache theo ['users', id]), đọc toggle từ Zustand
