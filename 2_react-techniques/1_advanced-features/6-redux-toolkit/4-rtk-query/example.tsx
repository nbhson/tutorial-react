import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Khai báo API một chỗ: 1 query đọc + 1 mutation ghi, đồng bộ bằng tags
export const postsApi = createApi({
  reducerPath: 'postsApi', // key trong store — gắn reducer theo key này
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'], // nhãn cache dùng chung — sai tên là invalidate rơi vào khoảng không
  endpoints: (b) => ({
    getPosts: b.query<{ id: number; title: string }[], void>({
      query: () => '/posts?_limit=5', // GET — mount là tự fetch + cache
      providesTags: ['Post'], // cung cấp nhãn: mutation xong thì query này refetch
    }),
    addPost: b.mutation<{ id: number }, { title: string }>({
      query: (body) => ({ url: '/posts', method: 'POST', body }), // POST — gọi tay khi submit
      invalidatesTags: ['Post'], // ghi xong: query nhãn Post tự tải lại
    }),
  }),
});
export const { useGetPostsQuery, useAddPostMutation } = postsApi.hooks; // hook tự sinh theo tên

// Store thêm đúng 2 dòng (gộp vào configureStore ở bài 1):
// reducer: { [postsApi.reducerPath]: postsApi.reducer }, // computed key — đừng hardcode chuỗi
// middleware: (g) => g().concat(postsApi.middleware), // quên là cache/refetch không chạy

// Component:
// const { data, isLoading, isError } = useGetPostsQuery(); // đọc tự động, có cache
// const [addPost, { isLoading: saving }] = useAddPostMutation(); // ghi: addPost({ title })
