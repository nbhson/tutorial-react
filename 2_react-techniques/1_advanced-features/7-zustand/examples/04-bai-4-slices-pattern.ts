// slices/cart.ts
export const createCartSlice: StateCreator<AppStore, [], [], CartSlice> = (set, get) => ({ /*...*/ });
// store.ts
export const useAppStore = create<AppStore>()<StateCreator<AppStore>[]>()((...a) => ({
  ...createCartSlice(...a),
  ...createAuthSlice(...a),
}));
