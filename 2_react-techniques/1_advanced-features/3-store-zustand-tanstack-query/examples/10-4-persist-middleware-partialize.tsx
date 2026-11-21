// ✅ ĐÚNG: chỉ lưu giỏ, không lưu hàm/token
import { persist } from 'zustand/middleware';
type Cart = { items: string[]; token: string; add: (x: string) => void };
export const useCart = create<Cart>()(persist((set) => ({
  items: [], token: '',
  add: (x) => set((s) => ({ items: [...s.items, x] })),
}), { name: 'cart', partialize: (s) => ({ items: s.items } as Cart) }));
