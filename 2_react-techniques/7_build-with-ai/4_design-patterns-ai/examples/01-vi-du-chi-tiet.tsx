// example.tsx — Streaming UI: render dần khi AI trả lời
import { Suspense, use } from 'react';

// Component đọc Promise từ action — suspend cho tới khi có kết quả
function AiAnswer({ work }: { work: Promise<string> }) {
  const text = use(work);
  return <article>{text}</article>;
}

export function ChatAnswer({ work }: { work: Promise<string> }) {
  return (
    // ⏳ fallback hiện ngay khi Promise chưa resolve — không block cả trang
    <Suspense fallback={<p role="status">AI đang trả lời…</p>}>
      <AiAnswer work={work} />
    </Suspense>
  );
}
