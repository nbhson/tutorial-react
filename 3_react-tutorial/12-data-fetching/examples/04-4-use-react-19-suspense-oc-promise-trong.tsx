// use() + Suspense (framework-level, gợi ý — SPA Vite không bắt buộc):
import { Suspense, use } from "react";
function Profile({ promise }: { promise: Promise<User> }) {
  const user = use(promise); // pending -> suspend, resolve -> vẽ; không cần useEffect + state
  return <p>{user.name}</p>;
}
<Suspense fallback={<p>Đang tải profile...</p>}><Profile promise={userPromise} /></Suspense>
