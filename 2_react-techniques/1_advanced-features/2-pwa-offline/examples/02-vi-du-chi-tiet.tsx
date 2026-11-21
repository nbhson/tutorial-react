// OnlineBadge: báo realtime trạng thái mạng bằng useSyncExternalStore
import { useSyncExternalStore } from 'react';

// subscribe: đăng ký listener; React gọi khi cần "theo dõi" store ngoài
function subscribe(cb: () => void) {
  window.addEventListener('online', cb);   // có mạng lại
  window.addEventListener('offline', cb);  // mất mạng
  return () => {
    // unsubscribe khi component unmount — tránh leak listener
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function OnlineBadge() {
  // getSnapshot trả giá trị hiện tại; React so sánh để quyết định re-render
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  return (
    <p role="status" style={{ color: online ? 'green' : 'red' }}>
      {online ? 'Đang online' : 'Đang offline — dùng cache'}
    </p>
  );
}
