import { Suspense } from 'react';
import { prerender } from 'react-dom/static';        // unstable_* trong core
import { resume } from 'react-dom/server';

// Build / first request:
const { prelude, postponed } = await prerender(<App />);
// -> gửi prelude (shell) cho client/CDN

// Request thật (hoặc khi hole cần dữ liệu):
const stream = await resume(<App />, postponed);
// -> stream phần dynamic về client

function App() {
  return (
    <Layout>                          {/* static — shell */}
      <Suspense fallback={<Skeleton />}>
        <PersonalFeed />              {/* dynamic hole — stream sau */}
      </Suspense>
    </Layout>
  );
}
