// Data layer
import { cache, cacheSignal } from 'react';        // cache trong request (RSC-only cho cacheSignal)
await fetch(url, { next: { revalidate: 60, tags: ['items'] } }); // cache xuyên request
revalidateTag('items');                             // xóa cache sau mutation
