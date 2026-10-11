import { Suspense, cache, cacheSignal, use } from 'react';

// Dedupe: cùng id trong cùng render chỉ fetch 1 lần,
// signal tự abort khi cache entry hết hạn.
const getUser = cache(async (id: string) => {
  console.log(`[fetch] user ${id}`);
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
    signal: cacheSignal(),
  });
  if (!res.ok) throw new Error('Fetch lỗi');
  return res.json() as Promise<{ name: string; email: string }>;
});

function UserCard({ id }: { id: string }) {
  const user = use(getUser(id));
  return (
    <p>
      {user.name} — {user.email}
    </p>
  );
}

export default function CacheSignalDemo() {
  return (
    <div>
      <h2>cacheSignal (React 19.2)</h2>
      <p>2 card cùng id=1 chỉ fetch 1 lần (xem console/network).</p>
      <Suspense fallback={<p>Đang tải...</p>}>
        <UserCard id="1" />
        <UserCard id="1" />
        <UserCard id="2" />
      </Suspense>
    </div>
  );
}
