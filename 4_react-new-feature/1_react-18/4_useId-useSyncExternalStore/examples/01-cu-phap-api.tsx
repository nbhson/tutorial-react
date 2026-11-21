import { useId, useSyncExternalStore } from 'react';

// useId
const id = useId();                        // ":r0:"
const inputId = `${id}-email`;             // ":r0:-email"

// useSyncExternalStore
const snapshot = useSyncExternalStore(
  subscribe,          // (onStoreChange: () => void) => unsubscribe: () => void
  getSnapshot,        // () => T  — phải trả cùng reference nếu không đổi
  getServerSnapshot?, // () => T  — dùng khi server render / hydrate
);
