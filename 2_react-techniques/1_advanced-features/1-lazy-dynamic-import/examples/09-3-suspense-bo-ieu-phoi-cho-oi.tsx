import { Suspense } from 'react';

// ✅ ĐÚNG: Suspense bọc ngoài lazy component, fallback là skeleton nhẹ
<Suspense fallback={<p>Đang tải biểu đồ…</p>}>
  <HeavyChart />
</Suspense>
