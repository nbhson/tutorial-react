import { cache, cacheSignal } from 'react';

const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    signal: cacheSignal(), // abort khi cache entry hết hạn / render bỏ
  });
  return res.json();
});
