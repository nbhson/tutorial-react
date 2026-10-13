# RTK Query — Fetch hợp nhất trong Redux

> Nguồn: https://redux-toolkit.js.org/rtk-query/overview
> Đọc kèm: [bài 3](../../3-store-zustand-tanstack-query/README.md) (so sánh với TanStack Query).

## Mục tiêu
- Định nghĩa API bằng `createApi`: baseQuery + endpoints query/mutation.
- Dùng hook tự sinh (`useGetXQuery`) và đồng bộ cache bằng tags (`providesTags`/`invalidatesTags`).
- Quyết định được: RTK Query hay TanStack Query cho app của mình.

## Khái niệm cốt lõi
- **`createApi({ reducerPath, baseQuery: fetchBaseQuery({ baseUrl }), endpoints })`**: khai báo tập trung mọi gọi API — RTK tự sinh reducer + middleware + hook, chỉ cần thêm 2 dòng vào store.
- **`query` vs `mutation`**: query = đọc (tự fetch + cache + refetch, hook trả `data/isLoading`), mutation = ghi (gọi tay qua trigger, xong thì invalidate).
- **Tags**: `providesTags: ["Post"]` (query cung cấp) + `invalidatesTags: ["Post"]` (mutation làm mất hiệu lực) — mutation xong, query liên quan tự refetch. Đây là bản "invalidateQueries" của RTK.
- **Hook tự sinh theo tên endpoint**: `getPosts` → `useGetPostsQuery()`, `addPost` → `useAddPostMutation()` — không viết `useQuery`/`useMutation` tay.
- **Gắn vào store**: `reducer: { [api.reducerPath]: api.reducer }` + `middleware: (g) => g().concat(api.middleware)` — quên middleware là cache/refetch không chạy.

## Ví dụ chi tiết
```tsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Khai báo API một chỗ: 1 query đọc + 1 mutation ghi
export const postsApi = createApi({
  reducerPath: 'postsApi', // key trong store — gắn reducer theo key này
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'], // nhãn cache dùng chung
  endpoints: (b) => ({
    getPosts: b.query<{ id: number; title: string }[], void>({
      query: () => '/posts?_limit=5', // GET — tự fetch + cache
      providesTags: ['Post'], // cung cấp nhãn: mutation ghi xong thì refetch
    }),
    addPost: b.mutation<{ id: number }, { title: string }>({
      query: (body) => ({ url: '/posts', method: 'POST', body }), // POST — gọi tay
      invalidatesTags: ['Post'], // ghi xong: query gắn nhãn Post tự tải lại
    }),
  }),
});
export const { useGetPostsQuery, useAddPostMutation } = postsApi.hooks; // hook tự sinh

// Store thêm 2 dòng (cùng file store.ts bài 1):
// reducer: { [postsApi.reducerPath]: postsApi.reducer },
// middleware: (g) => g().concat(postsApi.middleware), // quên dòng này là cache không chạy

// Component: đọc tự động, ghi qua trigger
// const { data, isLoading } = useGetPostsQuery(); // mount là fetch, có cache
// const [addPost] = useAddPostMutation(); // gọi khi bấm: addPost({ title })
```

## Giải thích từng phần
- `tagTypes` khai báo trước, endpoint dùng sau — sai tên tag là invalidate "rơi vào khoảng không", query không refetch.
- `query` nhận chuỗi (GET) hoặc object (method/body) — mutation luôn dạng object vì cần method + body.
- `useAddPostMutation()` trả tuple `[trigger, result]` — giống `useMutation` của TanStack: gọi trigger khi submit, đọc `result.isLoading` để disable nút.
- `reducerPath` là key động — dùng `[postsApi.reducerPath]` computed key, không hardcode chuỗi (đổi tên không vỡ).

## So sánh: RTK Query vs TanStack Query
- **Chọn RTK Query khi** app đã có Redux (một store, slice + fetch chung DevTools, tag invalidate gọn trong hệ sinh thái).
- **Chọn TanStack Query khi** app chưa có Redux (không kéo cả Redux vào chỉ để fetch; Devtools riêng, cộng đồng ví dụ nhiều hơn).
- **Tuyệt đối một thứ**: trộn cả hai là 2 cache song song, desync và tốn request. Quyết ở đầu dự án.

## Lỗi thường gặp
- **Quên `.concat(api.middleware)`** → query fetch được lần đầu nhưng không cache/refetch/polling. Fix: kiểm tra middleware ngay khi query "lạ".
- **Sai tên tag** (`providesTags: ["Posts"]` vs `invalidatesTags: ["Post"]`) → mutation xong list không cập nhật. Fix: `tagTypes` + hằng dùng chung, đừng gõ chuỗi rời rạc.
- **Dùng query cho ghi dữ liệu** → refetch vòng lặp, semantics sai. Fix: ghi luôn là mutation + invalidate.
- **Không xử lý `error` của query** → mạng lỗi là trắng. Fix: hook query cũng có `isError`/`error` — render nhánh lỗi như bài 2.

## Reference
- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview) · [Tags](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
