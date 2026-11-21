// Angular: Service + BehaviorSubject
// @Injectable({ providedIn: "root" })
// cart$ = new BehaviorSubject<CartItem[]>([]);
// add(item) { this.cart$.next([...this.cart$.value, item]); }
// Template: {{ (cart$ | async)?.length }}

// React: store ngoài component + subscribe (xem example.tsx đầy đủ dưới)
const cartStore = { items: [] as CartItem[], listeners: new Set<() => void>(), /* ... */ };
// Component: const count = useCartStore((s) => s.length);
