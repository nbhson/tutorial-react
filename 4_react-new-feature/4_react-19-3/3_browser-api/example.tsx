'use client';
// React 19.3 — browser() API (từ react-dom): đánh dấu component là browser-only.
// Đúng: import { browser } from 'react-dom' + dùng qua use(browser()).
// Sai (hay nhầm): import { browser } from 'react' rồi coi nó trả về env info.
import { Suspense, use } from 'react';
import { browser } from 'react-dom';

// Component này đọc timezone của thiết bị — không thể render trên server.
function TimeZone() {
  // SSR: suspend → fallback của <Suspense> gần nhất.
  // Client: trả undefined, KHÔNG suspend → render bình thường.
  use(browser('No default time zone was provided.'));
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <p>Múi giờ của bạn: {timeZone}</p>;
}

export default function BrowserApiDemo() {
  return (
    <div>
      <h2>browser() API (React 19.3)</h2>
      {/* BẮT BUỘC có <Suspense> khi SSR, nếu không server render sẽ fail. */}
      <Suspense fallback={<p>Đang xác định múi giờ...</p>}>
        <TimeZone />
      </Suspense>
      <p>
        <small>
          Trước 19.3 phải useEffect + useState 2-pass gây nháy; browser() cho
          component chỉ chạy ở browser, SSR tự dùng fallback.
        </small>
      </p>
    </div>
  );
}
