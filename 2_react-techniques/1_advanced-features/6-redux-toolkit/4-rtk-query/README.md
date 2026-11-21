# RTK Query — Fetch hợp nhất trong Redux

> Nguồn: https://redux-toolkit.js.org/rtk-query/overview
> Đọc kèm: [bài 3](../../3-store-zustand-tanstack-query/README.md) (so sánh với TanStack Query).

## Mục tiêu

Mục này nói về ba đích đến của bài: khai báo API tập trung, dùng hook tự sinh + cache theo tags, và biết chọn giữa RTK Query với TanStack Query. Đọc để thấy lộ trình.

- Định nghĩa API bằng `createApi`: baseQuery + endpoints query/mutation.
- Dùng hook tự sinh (`useGetXQuery`) và đồng bộ cache bằng tags (`providesTags`/`invalidatesTags`).
- Quyết định được: RTK Query hay TanStack Query cho app của mình.

> **Tóm gọn 1 câu:** RTK Query biến mọi lời gọi API thành một "thực đơn khai báo" — định nghĩa một lần, hook + cache + refetch sinh sẵn cho bạn.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của RTK Query — đọc để hiểu bộ máy chạy ngầm trước khi dùng hook.

- **`createApi({ reducerPath, baseQuery: fetchBaseQuery({ baseUrl }), endpoints })`**: khai báo tập trung mọi gọi API — RTK tự sinh reducer + middleware + hook, chỉ cần thêm 2 dòng vào store. Ví von: thay vì mỗi phòng tự múc nước từ giếng, bạn xây một vòi nước chung cả nhà vặn dùng.
- **`query` vs `mutation`**: query = đọc (tự fetch + cache + refetch, hook trả `data/isLoading`), mutation = ghi (gọi tay qua trigger, xong thì invalidate). Hãy nhớ như "đọc thì máy phục vụ, ghi thì mình bấm chuông".
- **Tags**: `providesTags: ["Post"]` (query cung cấp) + `invalidatesTags: ["Post"]` (mutation làm mất hiệu lực) — mutation xong, query liên quan tự refetch. Đây là bản "invalidateQueries" của RTK. Ví von: mutation xóa bài là "xé tem" trên kệ hàng — máy thấy kệ đó mất tem thì tự đi nhập hàng mới.
- **Hook tự sinh theo tên endpoint**: `getPosts` → `useGetPostsQuery()`, `addPost` → `useAddPostMutation()` — không viết `useQuery`/`useMutation` tay.
- **Gắn vào store**: `reducer: { [api.reducerPath]: api.reducer }` + `middleware: (g) => g().concat(api.middleware)` — quên middleware là cache/refetch không chạy, như lắp tủ lạnh nhưng quên cắm điện.

> **Tóm gọn 1 câu:** `createApi` khai báo một lần sinh mọi hook, query tự phục vụ còn mutation phải invalidate tag để cache biết đi lấy hàng mới.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về những chi tiết trong ví dụ dễ sai không đáng có — đọc để khỏi "invalidate rơi vào khoảng không".

- `tagTypes` khai báo trước, endpoint dùng sau — sai tên tag là invalidate "rơi vào khoảng không", query không refetch.
- `query` nhận chuỗi (GET) hoặc object (method/body) — mutation luôn dạng object vì cần method + body.
- `useAddPostMutation()` trả tuple `[trigger, result]` — giống `useMutation` của TanStack: gọi trigger khi submit, đọc `result.isLoading` để disable nút.
- `reducerPath` là key động — dùng `[postsApi.reducerPath]` computed key, không hardcode chuỗi (đổi tên không vỡ).

## So sánh: RTK Query vs TanStack Query

Mục này nói về cách chọn công cụ fetch cho dự án của bạn — đọc để quyết một lần đúng từ đầu thay vì đổi giữa chừng.

- **Chọn RTK Query khi** app đã có Redux (một store, slice + fetch chung DevTools, tag invalidate gọn trong hệ sinh thái).
- **Chọn TanStack Query khi** app chưa có Redux (không kéo cả Redux vào chỉ để fetch; Devtools riêng, cộng đồng ví dụ nhiều hơn). Ví von: nhà đã có tủ đồ Redux thì mua thêm ngăn kéo cùng hãng; nhà trống thì chọn tủ nào hợp nhất là được.
- **Tuyệt đối một thứ**: trộn cả hai là 2 cache song song, desync và tốn request. Quyết ở đầu dự án.

## Lỗi thường gặp

Mục này nói về 4 bẫy phổ biến với RTK Query — đọc để cache của bạn chạy đúng như hứa.

- **Quên `.concat(api.middleware)`** → query fetch được lần đầu nhưng không cache/refetch/polling. Fix: kiểm tra middleware ngay khi query "lạ".
- **Sai tên tag** (`providesTags: ["Posts"]` vs `invalidatesTags: ["Post"]`) → mutation xong list không cập nhật. Fix: `tagTypes` + hằng dùng chung, đừng gõ chuỗi rời rạc.
- **Dùng query cho ghi dữ liệu** → refetch vòng lặp, semantics sai. Fix: ghi luôn là mutation + invalidate.
- **Không xử lý `error` của query** → mạng lỗi là trắng. Fix: hook query cũng có `isError`/`error` — render nhánh lỗi như bài 2.

> **Tóm gọn 1 câu:** Nhớ middleware, đúng tên tag, ghi là mutation, và luôn render nhánh lỗi — đủ bốn là cache RTK Query chạy như đồng hồ.

## Reference

- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview) · [Tags](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
