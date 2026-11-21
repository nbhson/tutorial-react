// store.ts — store ở module scope, KHÔNG đặt trong component
const useCartStore = create<CartState>()((set, get) => ({
  items: [] as Item[],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })), // immutable — KHÔNG push
  clear: () => set({ items: [] }),
}));

// Trong component — selector nhỏ, trả primitive
const count = useCartStore((s) => s.items.length); // chỉ re-render khi items đổi

// Nhiều field — useShallow tránh re-render thừa
const { items, coupon } = useCartStore(useShallow((s) => ({ items: s.items, coupon: s.coupon })));

// Ngoài React (axios interceptor, router guard):
if (useCartStore.getState().coupon) { /* đọc state không cần hook */ }
