// example.tsx — useId + useSyncExternalStore (React 18)
import { useId, useSyncExternalStore } from 'react';

// --- useSyncExternalStore: cửa sổ resize ---
function subscribeWidth(callback: () => void) {
  window.addEventListener('resize', callback); // gọi mỗi khi resize
  return () => window.removeEventListener('resize', callback); // cleanup bắt buộc
}
function getWidthSnapshot() {
  return window.innerWidth; // snapshot thô (number — ổn định reference)
}
function getWidthServerSnapshot() {
  return 1024; // SSR: giá trị cố định → server HTML khớp client ban đầu
}

// --- useId: label gắn input ---
function EmailField() {
  const id = useId(); // ổn định server/client, ví dụ ":r0:"
  return (
    <div>
      {/* nối hậu tố để có id riêng cho từng element */}
      <label htmlFor={`${id}-email`}>Email</label>
      <input id={`${id}-email`} type="email" placeholder="ban@example.com" />
    </div>
  );
}

export default function IdStoreDemo() {
  // Số 1: đọc innerWidth + re-render khi đổi (subscribe ngoài React)
  const width = useSyncExternalStore(
    subscribeWidth,
    getWidthSnapshot,
    getWidthServerSnapshot,
  );

  return (
    <div>
      <h2>useId + useSyncExternalStore (React 18)</h2>
      {/* 2 lần gọi → 2 ID khác nhau, không xung đột label/input */}
      <EmailField />
      <EmailField />
      <p>Chiều rộng cửa sổ (subscribe ngoài React): {width}px</p>
      <p>Chế độ: {width < 768 ? 'Mobile' : 'Desktop'}</p>
    </div>
  );
}
