// example.tsx — timezone chỉ đọc được ở browser, SSR dùng fallback
'use client';
import { Suspense, use } from 'react';
import { browser } from 'react-dom';

function TimeZone() {
  // SSR: suspend → fallback. Client: trả undefined rồi đọc API browser thật.
  use(browser('No default time zone was provided.'));
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <p>Múi giờ: {timeZone}</p>;
}

export default function BrowserApiDemo() {
  return (
    <div>
      <h2>browser() API (React 19.3)</h2>
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
