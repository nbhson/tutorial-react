import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function OnlineBadge() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  return (
    <p role="status" style={{ color: online ? 'green' : 'red' }}>
      {online ? 'Đang online' : 'Đang offline — dùng cache'}
    </p>
  );
}
