import { Suspense, use } from 'react';

// Pattern Streaming UI: component suspend trong khi chờ AI,
// fallback hiển thị trạng thái chờ — không block cả trang.
function AiAnswer({ work }: { work: Promise<string> }) {
  const text = use(work);
  return <article>{text}</article>;
}

export function ChatAnswer({ work }: { work: Promise<string> }) {
  return (
    <Suspense fallback={<p role="status">AI đang trả lời…</p>}>
      <AiAnswer work={work} />
    </Suspense>
  );
}
