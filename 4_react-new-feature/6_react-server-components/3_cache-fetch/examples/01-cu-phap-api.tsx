import { cache, cacheSignal } from 'react';
import { unstable_cache } from 'next/cache';

// 1) Dedupe trong 1 request
const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    cache: 'force-cache',
    next: { revalidate: 60, tags: ['users'] },
  });
  return res.json();
});

// 2) Cache xuyên request theo tag
const getPosts = unstable_cache(
  async () => db.post.findMany(),
  ['posts'],            // cache key parts
  { tags: ['posts'], revalidate: 3600 },
);

// 3) Revalidate sau mutation (trong Server Action)
// revalidatePath('/posts');
// revalidateTag('posts');

// 4) Hủy việc khi vòng đời cache() kết thúc (React 19.2, RSC-only)
const getReport = cache(async (id: string) => {
  const signal = cacheSignal();
  return fetch(`https://api.example.com/report/${id}`, { signal });
});
