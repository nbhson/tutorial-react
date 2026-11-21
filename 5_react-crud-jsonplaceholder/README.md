# 5 — CRUD Posts với JSONPlaceholder (chuẩn prod)

## Mục tiêu

Mục này nêu "3 đích đến" của project: app chạy được, stack chuẩn prod, và hiểu rõ giới hạn của API fake. Đọc trước để biết mình sẽ nhận được gì.

- Có 1 app Vite + React + TS chạy được (`npm run dev`) demo đủ CRUD trên `https://jsonplaceholder.typicode.com/posts`.
- Áp dụng đúng stack chuẩn của repo: **TanStack Query v5** (server state), **Zustand** (client state),
  **React Router v7** (routing), **react-hook-form + Zod** (form), **lazy/Suspense**, **memo + useDeferredValue**,
  **ErrorBoundary**, **Vitest**.
- Hiểu giới hạn của JSONPlaceholder (API fake, không persist) và cách mirror vào Query cache.

> **Tóm gọn 1 câu:** Project này là "bản tập CRUD chuẩn prod" — full stack (Query + Zustand + Router + RHF/Zod) trên một API fake để luyện an toàn.

## Khái niệm cốt lõi

Mục này định nghĩa 4 nền tảng của project: JSONPlaceholder là gì, CRUD gồm gì, và ranh giới server/client state. Nắm hết mục này thì đọc code không còn bỡ ngỡ.
- **JSONPlaceholder là fake REST:** `GET /posts` trả 100 items; `POST` luôn trả `{ id: 101 }`; `PUT/DELETE`
  thành công nhưng **không lưu thật**. Ví von: đây là "cây cảnh trong showroom" — trông như thật, tưới nước cũng được, nhưng không bao giờ mọc thêm lá. F5 là mất thay đổi local.
- **CRUD = 4 verb HTTP:** `GET` (Read list/detail) · `POST` (Create) · `PUT` (Update full) · `DELETE` (xóa).
- **Server state ≠ client state (DAY 8 + nhóm 1):** posts trong TanStack Query cache; search/notice trong Zustand.
  Ví von: server state là "hàng trong kho" (Query quản lý, có hạn dùng, tự nhập lại), client state là "ghi chú dán tủ lạnh" (Zustand). Không nhét server data vào Zustand, không fetch trong store.
- **Keyword:** `useQuery`, `useMutation`, `queryKey`, `setQueryData`, `useDeferredValue`, `memo`,
  `lazy` + `Suspense`, `ErrorBoundary`, `zodResolver`, `VITE_*` env.

> **Tóm gọn 1 câu:** Fake API luyện tay, CRUD 4 verb, và "luật chia nhà": server state ở Query, client state ở Zustand, form state ở RHF.

## Luồng hoạt động

Mục này đi theo 7 bước vòng đời app từ lúc boot đến lúc mở trang detail — đọc tuần tự để nắm cách dữ liệu chảy.
1. Boot: `main.tsx` → `App` dựng `QueryClientProvider` + `ErrorBoundary` + `RouterProvider`.
2. Route `/`: `PostsPage` gọi `usePosts()` → `GET /posts?_limit=20` (signal từ Query, auto-abort khi unmount).
   `isPending` → "Đang tải..."; `isError` → alert; success → render grid.
3. Create: submit form (RHF + Zod) → `useCreatePost` → `POST /posts` → sinh `id` local (API luôn trả 101)
   → `setQueryData(list)` prepend → notice qua Zustand.
4. Edit: "Sửa" → `editing` local → form reset theo post → `PUT /posts/:id` → `setQueryData` replace cả
   list + detail → clear `editing`.
5. Delete: `confirm()` → `DELETE /posts/:id` → `setQueryData` filter + `removeQueries(detail)`.
6. Search: input ghi vào Zustand → `useDeferredValue` + `filterPosts()` (hàm thuần, có test) → `memo(PostCard)`.
7. Route `/posts/:id`: lazy-load + `Suspense` → `usePost(id)` đọc `queryKey: ["posts","detail",id]`.

> **Tóm gọn 1 câu:** Boot → list → create/edit/delete đều mirror vào Query cache → search defer → detail lazy-load — một vòng CRUD trọn vẹn không refetch thừa.

## Ví dụ chi tiết

Mục này bày toàn bộ cây thư mục của project — mỗi file một vai, đọc cấu trúc trước rồi đọc code sẽ đỡ lạc.
Cấu trúc:

```text
5_react-crud-jsonplaceholder/
├── .env / .env.example      # VITE_API_URL, VITE_POSTS_LIMIT (nhóm 4)
├── package.json / vite.config.ts (có test jsdom) / tsconfig*.json
└── src/
    ├── main.tsx             # createRoot + StrictMode
    ├── App.tsx              # composition root: QueryProvider -> Boundary -> Router
    ├── router.tsx           # createBrowserRouter + lazy detail (DAY 13/14)
    ├── types.ts             # Post, PostInput
    ├── api/posts.ts         # fetch + checkOk + signal (DAY 12 tầng manual)
    ├── lib/
    │   ├── env.ts           # Zod validate env, fail-fast (nhóm 4)
    │   ├── queryClient.ts   # staleTime/gcTime/retry + postsKeys (DAY 12)
    │   ├── postSchema.ts    # Zod schema form (DAY 11)
    │   └── filter.ts        # filterPosts thuần (DAY 21, có test)
    ├── hooks/usePosts.ts    # usePosts/usePost/useCreate/Update/Delete (DAY 16 custom hooks)
    ├── store/ui.ts          # Zustand search + notice (DAY 8)
    ├── components/
    │   ├── PostForm.tsx     # react-hook-form + zodResolver (DAY 11)
    │   ├── PostCard.tsx     # memo (DAY 10)
    │   └── ErrorBoundary.tsx# class boundary (nhóm 8)
    └── pages/
        ├── Layout.tsx       # Outlet + notice (DAY 14)
        ├── PostsPage.tsx    # CRUD + useDeferredValue search (nhóm 3)
        └── PostDetailPage.tsx # lazy route /posts/:id
```

Chạy:

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.sh`](examples/01-vi-du-chi-tiet.sh)

## Giải thích từng phần
- `api/posts.ts`: tầng HTTP thuần giữ nguyên để ai cũng đọc được; `checkOk()` vì `fetch` không reject
  với HTTP 4xx/5xx; nhận `signal` nên TanStack Query tự abort khi unmount.
- `lib/queryClient.ts`: `staleTime: 30s` (remount không refetch), `gcTime: 5p`, `retry: 2`;
  `postsKeys.list(limit)` chứa limit để sau này phân trang không sai cache.
- `hooks/usePosts.ts`: custom hooks (DAY 16) bọc Query; mutation mirror vào cache thay vì refetch cả list
  (rẻ + demo được dù API fake); `detail` cũng được sync sau update, xóa sau delete.
- `store/ui.ts`: Zustand chỉ giữ UI state; `flash()` tự clear sau 3s (clearTimeout cũ trước khi đặt mới).
- `PostForm.tsx`: RHF + `zodResolver(postSchema)`; `reset()` khi `initial` đổi để chuyển Create ↔ Edit
  không kẹt dữ liệu cũ; `mode: "onChange"` nên `isValid` live.
- `PostCard.tsx`: `memo` — list 20 items gõ search không render lại card không đổi (kết hợp `useDeferredValue`).
- `router.tsx`: `index` + `posts/:id`; detail `lazy()` tách chunk, `Suspense` fallback rõ ràng.
- `ErrorBoundary.tsx`: class duy nhất bắt được lỗi render; nút "Thử lại" reset state.
- `lib/env.ts`: `VITE_API_URL` qua Zod `.url()`, `VITE_POSTS_LIMIT` coerce 1..100; sai → throw khi boot.
- Test (nhóm 6): `filter.test.ts` + `postSchema.test.ts` (logic thuần) + `posts.test.ts` (mock `fetch`,
  assert `_limit` + `checkOk`) — chạy không cần mạng.

## Mapping kỹ thuật repo → project này

Mục này là "bảng đối chiếu kiến thức đã học → chỗ dùng thật" — tra để thấy từng DAY/Nhóm nằm ở file nào của project.

| Nguồn trong repo | Áp dụng ở đâu | Ghi chú |
|---|---|---|
| DAY 2 conditional/list, DAY 3 props | `PostsPage` + `PostCard` props | Cơ bản, giữ nguyên |
| DAY 8 external-store | `store/ui.ts` (Zustand) | Chỉ UI state, server state ở Query |
| DAY 10 memo/format | `memo(PostCard)` | Không memo thừa cả page |
| DAY 11 forms | `PostForm` RHF + Zod | Thay validate tay bản trước |
| DAY 12 data-fetching | `useQuery` + `useMutation` + `setQueryData` | Đúng chuẩn prod, thay `useEffect` manual |
| DAY 13 lazy/Suspense | `router.tsx` lazy detail | Tách chunk route nặng |
| DAY 14 router | `createBrowserRouter` `/` + `/posts/:id` | Có trang detail thật |
| DAY 15 effects / DAY 16 hooks | `hooks/usePosts.ts` | Effect thô dồn vào hook có cache |
| DAY 21 testing | `*.test.ts` + `npm test` | Logic thuần + mock fetch |
| Nhóm 1 advanced (Query+store, lazy) | hooks + store + router | Đúng tách server/client state |
| Nhóm 2 architecture | `App` composition root, `lib/hooks/store/pages` | Chưa FSD full (app nhỏ chưa cần) |
| Nhóm 3 performance | `memo` + `useDeferredValue` | Chưa virtualization (list chỉ 20) |
| Nhóm 4 security/config | `lib/env.ts` + Zod + `.env.example` | Chưa auth/CSP (CRUD public demo) |
| Nhóm 6 dev-tools | Vite + Vitest + jsdom + RTL deps | Chưa thêm ESLint config (có thể thêm sau) |
| Nhóm 8 best-practices | `ErrorBoundary` + `role="alert/status"` + label search | Chuẩn tối thiểu a11y + lỗi |
| React 18 (`useDeferredValue`) | search input | Có |
| Chưa áp dụng (cố ý) | PWA, Web Worker, i18n, dnd-kit, ViewTransition, RSC/Server Actions, micro-frontend | Quá khổ cho CRUD 2 trang; thêm khi cần |

> **Cách đọc bảng này:** mỗi hàng là một bài học trong repo — cột giữa cho biết kỹ thuật đó "đậu" ở file nào của project, cột Ghi chú nêu mức độ áp dụng (đủ, chưa, hoặc cố ý bỏ). Đọc theo chiều dọc để ôn lại lộ trình đã học.

## Bảng so sánh Angular ↔ React

Mục này dành cho ai đến từ Angular: mỗi hàng là một khái niệm Angular quen thuộc và "đối tác" tương đương trong project React này.

| Angular | React (project này) | Ghi chú |
|---|---|---|
| `HttpClient` + interceptor | `api/posts.ts` wrapper `fetch` + `checkOk` | Tự viết tầng giữa |
| Service + DI | module `api/` + hooks `usePosts` import trực tiếp | Không cần DI |
| `async` pipe / RxJS `retry` | `useQuery` (`isPending/isError`, `retry: 2`) | Khai báo thay vì operators |
| Template-driven/Reactive forms | `react-hook-form` + `zodResolver` | Tương đương Reactive forms |
| Router + resolver/guard | `createBrowserRouter` + `usePost` trong page | Chưa guard (không có auth) |
| NgRx/ComponentStore | Zustand (UI) + TanStack Query (server) | Nhẹ hơn, đúng ranh giới state |

> **Cách đọc bảng này:** cột trái là "quê nhà" của bạn (Angular), cột giữa là cách React làm việc tương đương — đọc ngang từng hàng để dịch chuyển tư duy, cột Ghi chú nêu điểm khác biệt tinh tế.

## Lỗi thường gặp

Mục này là 8 bẫy kinh điển khi dùng TanStack Query — mỗi bẫy có fix ngay cạnh, đáng đọc kỹ vì đều là lỗi thật ngoài prod.
- **Quên `if (!r.ok)`** → HTTP lỗi vẫn `res.json()` và crash. → Fix: `checkOk()`.
- **Key chung cho mọi limit** (`["posts"]` cho cả page 1/2) → sai cache. → Fix: `postsKeys.list(limit)`.
- **Tạo `QueryClient` mới mỗi render** → mất cache. → Fix: singleton ở `lib/queryClient.ts`.
- **Nhét posts vào Zustand** → mất cache/retry/dedupe của Query. → Fix: server state ở Query only.
- **API luôn trả `id: 101`** → key trùng. → Fix: sinh `id = Date.now()` cho item local.
- **Form Edit kẹt dữ liệu cũ** → Fix: `reset(initial)` + `key={editing.id}`.
- **`useQuery` trong điều kiện/vòng lặp** → vi phạm rules of hooks. → Fix: `enabled` + tách component.
- **Tưởng API lưu thật** → F5 mất. → Hiểu: fake API, mutation mirror cache local.

## Best practices

Mục này chốt lại 5 nguyên tắc "sống sót trong prod" rút ra từ project — viết code tiếp theo cũng nên giữ các nguyên tắc này.
- Server state (Query) / client state (Zustand) / form state (RHF) để riêng 3 chỗ.
- `queryKey` có cấu trúc `["posts","list",limit]` để invalidate/selective update đúng nhóm.
- Mutation fake-API: `setQueryData` mirror ngay thay vì `invalidate` refetch (đỡ request vô ích).
- Validate ở biên (Zod schema + env schema), không validate rải rác trong component.
- Search dùng `useDeferredValue` + hàm thuần `filterPosts` có test.

## Bài tập nhỏ
1. Thêm phân trang: `usePosts(page)` với `queryKey ["posts","list",page]` + `placeholderData: keepPreviousData`.
2. Thêm optimistic delete: `onMutate` filter trước, `onError` rollback, `onSettled` invalidate.
3. Thêm test RTL cho `PostCard` (render title + click Sửa gọi handler).
4. Thêm ESLint flat + `eslint-plugin-react-hooks` v6 rồi chạy `eslint .`.

> **Tóm gọn 1 câu:** CRUD chuẩn prod = chia 3 kho state (Query/Zustand/RHF) + key có cấu trúc + mirror cache thay vì refetch + validate ở biên.

## Reference
- https://jsonplaceholder.typicode.com/guide/
- DAY 11/12/14/21: `3_react-tutorial/11-forms`, `12-data-fetching`, `14-router`, `21-testing-e2e`
- Nhóm 1/3/4/6/8: `2_react-techniques/...`
- https://tanstack.com/query/latest · https://zustand.docs.pmnd.rs · https://react-hook-form.com · https://zod.dev
