// example.tsx — DAY 8: external store tối giản (không cần lib)
import { useSyncExternalStore } from "react";

const store = {
  value: 0,
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  },
  getSnapshot() { return store.value; },
  inc() { store.value++; store.listeners.forEach((l) => l()); },
};

function useCounterStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export default function App() {
  const count = useCounterStore();
  return (
    <>
      <p>Count (external store): {count}</p>
      <button onClick={() => store.inc()}>+1</button>
    </>
  );
}
