import { useId, useSyncExternalStore } from 'react';

function subscribeWidth(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}
function getWidthSnapshot() {
  return window.innerWidth;
}
function getWidthServerSnapshot() {
  return 1024; // SSR fallback cố định → tránh hydration mismatch
}

function EmailField() {
  const id = useId(); // ổn định server/client, ví dụ ":r0:"
  return (
    <div>
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} type="email" placeholder="ban@example.com" />
    </div>
  );
}

export default function IdStoreDemo() {
  const width = useSyncExternalStore(
    subscribeWidth,
    getWidthSnapshot,
    getWidthServerSnapshot,
  );

  return (
    <div>
      <h2>useId + useSyncExternalStore (React 18)</h2>
      <EmailField />
      <EmailField />
      <p>Chiều rộng cửa sổ (subscribe ngoài React): {width}px</p>
      <p>Chế độ: {width < 768 ? 'Mobile' : 'Desktop'}</p>
    </div>
  );
}
