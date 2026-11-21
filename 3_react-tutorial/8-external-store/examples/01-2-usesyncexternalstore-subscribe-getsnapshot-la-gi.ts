function useCartStore<T>(selector: (items: CartItem[]) => T): T {
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getSnapshot()));
}
