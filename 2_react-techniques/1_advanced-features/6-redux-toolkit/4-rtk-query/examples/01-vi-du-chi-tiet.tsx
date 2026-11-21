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
