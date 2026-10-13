import { Suspense, cache, use } from 'react';

// 1. cache(): cùng id trong 1 request chỉ fetch 1 lần.
const getUser = cache(async (id: string) => {
  console.log(`[fetch] user ${id}`);
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
    // 2. fetch caching (Next): cache xuyên request 60s.
    // Trong Next: { next: { revalidate: 60, tags: ['users'] } }
    // Demo Vite/plain React: dùng cache mặc định của fetch wrapper.
  });
  if (!res.ok) throw new Error('Fetch lỗi');
  return res.json() as Promise<{ name: string; phone: string }>;
});

function UserCard({ id }: { id: string }) {
  const user = use(getUser(id));
  return (
    <p>
      {user.name} — {user.phone}
    </p>
  );
}

export default function CacheFetchDemo() {
  return (
    <div>
      <h2>cache() + fetch caching (RSC)</h2>
      <p>2 card id=1 dedupe thành 1 fetch (xem console).</p>
      <Suspense fallback={<p>Đang tải...</p>}>
        <UserCard id="1" />
        <UserCard id="1" />
        <UserCard id="2" />
      </Suspense>
      <p>
        <small>
          Sau mutation gọi revalidateTag('users') / revalidatePath('/users') để
          xóa cache có chủ đích (Next.js).
        </small>
      </p>
    </div>
  );
}
