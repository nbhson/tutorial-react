const useStore = create<State>()(
  persist(
    immer((set) => ({ /* ... */ })),
    {
      name: "cart",
      version: 2,                       // đổi shape => bump version
      migrate: (old, v) => (v === 2 ? { ...old, coupon: null } : old),
      partialize: (s) => ({ items: s.items }), // KHÔNG persist loading/error
    }
  )
);
