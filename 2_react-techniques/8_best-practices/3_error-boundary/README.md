# Error Boundary + Xử lý lỗi

> Nguồn: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary — https://tanstack.com/query/latest/docs/framework/react/guides/error-handling

Một component lỗi có thể làm sập trắng cả trang app của bạn — trừ khi có "lưới an toàn" chặn lại. Mục này dạy bạn dựng hệ thống 3 tầng bắt lỗi: lưới quanh vùng render, lưới tầng dữ liệu, và lưới toàn cục.

## Mục tiêu

Mục này nêu 3 đích khi xử lý lỗi trong React. Đọc để biết sau bài này app của bạn sẽ chịu được sự cố cỡ nào.

- Nắm 3 tầng xử lý lỗi: render (Error Boundary), data (Query retry), toàn cục (log + fallback UI).
- Bọc vùng UI bằng `react-error-boundary` có nút thử lại và `resetKeys`.
- Cấu hình TanStack Query không retry lỗi 4xx, phân biệt lỗi mạng vs lỗi client.

> **Tóm gọn 1 câu:** Sau bài này: lỗi render chỉ làm sập vùng bị lỗi chứ không sập cả app, lỗi data biết retry đúng chỗ, và mọi lỗi đều được ghi lại.

## Tổng quan

Mục này giải thích cơ chế Error Boundary và ranh giới của nó. Đọc để hiểu "cái gì bắt được, cái gì không" trước khi bọc code.

- Một component throw khi render có thể làm **vỡ cả cây React** nếu không có boundary.
- Error Boundary (class component dùng `getDerivedStateFromError` + `componentDidCatch`) bắt lỗi render/lifecycle của con — tương tự `angular/error-handler` nhưng theo vùng UI.
- Data lỗi (fetch/query) **không nên** nằm trong boundary — xử lý riêng ở tầng query.
- Áp dụng cho: mô-đun remote MF (bài 5/1), widget độc lập, lazy component, query/error boundary.

Ví von: Error Boundary như **ngăn khóa chống tràn (aptomat)** trong nhà — chập ở phòng khách thì chỉ ngắt phòng khách, bếp và phòng ngủ vẫn sáng; nếu chỉ có một cầu dao tổng thì một sự cố là cả nhà tối om.

> **Tóm gọn 1 câu:** Error Boundary là cầu dao theo vùng: lỗi render của con không kéo sập cả cây — nhưng lỗi data thì phải xử lý ở tầng query riêng.

## Khái niệm cốt lõi

Mục này định nghĩa 6 khái niệm: boundary bắt gì/không bắt gì, cơ chế hoạt động, thư viện wrapper, lỗi query, lỗi route, và log tập trung. Đọc để biết ranh giới từng tầng trước khi gắn code.

- **Error Boundary bắt gì**: lỗi từ render, lifecycle, constructor của **children** — nhưng **không** bắt: event handler, async code (`setTimeout`, promise ngoài render), `Server Components`/SSR (Next.js cần `global-error.js`), lỗi của chính boundary.
- **Cơ chế**: khi con throw, boundary tìm gần nhất → commit fallback UI (không unmount phần còn lại).
- **`react-error-boundary`**: wrapper class boundary dùng được kiểu hook/khi báo; cung cấp `resetErrorBoundary`, `resetKeys`, `onError`.
- **TanStack Query error**: `isError`, `error`, `retry`, `refetch`; phân biệt lỗi mạng (retry) vs 4xx client (không retry).
- **Route error**: React Router `errorElement` cho loader/action fail (khác lỗi render thường).
- **Log tập trung**: đưa lỗi + `componentStack` vào Sentry; không `console.log` bỏ qua.

> **Tóm gọn 1 câu:** Boundary chỉ "điện lưới" cho lỗi render — event handler và async phải tự catch, data có Query lo, còn mọi lỗi đều phải chảy về một nơi ghi log.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước dựng hệ thống lỗi hoàn chỉnh, từ boundary toàn cục đến try-catch tay. Làm tuần tự — mỗi bước vá một tầng khác nhau.

1. Tạo `AppErrorBoundary` toàn cục (fallback cả trang) + bọc vùng quan trọng riêng.
2. Trong boundary: `onError` gửi Sentry kèm `componentStack`, fallback có nút "Thử lại" (`resetErrorBoundary`), dùng `resetKeys` khi deps lỗi thay đổi.
3. Query: thiết lập `retry` mặc định không đánh 4xx; xử lý message lỗi theo `error.response.status`.
4. Route: khai `errorElement` cho loader/action.
5. Sự kiện/async: try-catch thủ công + set state lỗi riêng (boundary không giúp).

> **Tóm gọn 1 câu:** 5 bước cho 5 tầng: boundary tổng → boundary vùng có log + nút thử lại → query retry thông minh → route errorElement → try-catch tay cho event/async.

## Ví dụ chi tiết

Mục này trỏ tới 3 file code mẫu dựng boundary thật. Đọc kèm file để thấy mỗi khái niệm thành code.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

> **Tóm gọn 1 câu:** Ba file ví dụ = ba tầng: boundary vùng có reset, query xử lý 4xx/5xx, route errorElement — ghép lại là hệ thống lỗi hoàn chỉnh.

## Giải thích từng phần

Mục này bóc từng prop/API trong ví dụ để bạn hiểu cơ chế. Đọc khi cần chỉnh fallback hoặc retry theo nhu cầu riêng.

- `fallbackRender`: render fallback có quyền truy cập `error` + `resetErrorBoundary`.
- `onError`: hook log trước khi fallback hiện — Sentry nhận `componentStack`.
- `resetKeys={[fail]}`: khi `fail` đổi, boundary tự reset — rất tiện khi lỗi do prop quyết định.
- `isClientError`: đọc `status` từ error — 4xx không retry (tiết kiệm request vô ích); mạng/5xx retry.
- `errorElement`: boundary ở cấp route — bao phủ render + loader + action.

> **Tóm gọn 1 câu:** Mỗi prop là một mảnh ghép: `fallbackRender` cho giao diện dự phòng, `onError` cho log, `resetKeys` cho tự phục hồi, `retry` cho data, `errorElement` cho route.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 lỗi hay gặp khi dựng hệ thống bắt lỗi. Đọc để không tự bẫy mình sau khi đã có boundary.

- **Dùng Error Boundary cho event handler/async**: không bắt được → dùng try-catch trong handler + set state lỗi.
- **Một boundary to nhất bọc cả app**: mất context, mọi lỗi đều "trắng trang" → chia boundary theo vùng, giữ app-level làm cuối cùng.
- **Retry mặc định cho 4xx**: tràn request với 401/403 → tùy biến `retry` bỏ qua 4xx.
- **Log lỗi chỉ `console.log`**: mất khi production → `onError` gửi Sentry + ghi `componentStack`.
- **Quên `resetKeys`/nút thử lại**: user bị "kẹt" ở fallback vĩnh viễn → luôn tạo đường retry hoặc tự reset.

Lỗi "bọc một boundary to nhất" chính là biến thể xấu của ví von atomat ở trên: chỉ để **một cầu dao tổng cho cả nhà** — chập nhẹ ở phòng tắm cũng mất điện toàn bộ.

> **Tóm gọn 1 câu:** Năm lỗi chung một bài học: boundary không phải đũa thần — đúng chỗ thì hữu ích, bọc sai tầng hoặc quên đường thoát thì user kẹt trong fallback.

## Best practices / Mẹo

Mục này gom mẹo thiết kế hệ thống lỗi bền vững. Đọc sau khi đã dựng boundary cơ bản chạy được.

- Boundary ở 3 mức: app-level (cuối cùng), vùng chức năng (đổi fallback nhẹ), widget độc lập.
- Fallback nên có: message gọn, nút thử lại, (tùy) nút "liên hệ hỗ trợ".
- Thống nhất việc log lỗi qua helper `reportError` (Sentry) — dùng mọi nơi.
- Query: hiện skeleton/empty/error riêng, gộp `isPending`/`isError` vào một thành phần.
- Kết hợp React 19 `<Suspense>` + errorElement: fallback chờ và fallback lỗi tách biệt.

> **Tóm gọn 1 câu:** Ba mức boundary nhỏ dần từ ngoài vào trong, fallback luôn có lối thoát, và mọi lỗi chảy về một helper log duy nhất.

## Bài tập nhỏ

Viết `ErrorBoundary` với fallback có nút "Thử lại" và `resetKeys`. Bọc `ProfileCard` (component render `undefined.length` cố ý throw khi `fail`). Sửa `retry` của query để 409 không retry nhưng 503 retry 3 lần; thêm test xác nhận bằng renderHook + MSW.

## Reference
- [React — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- [TanStack Query — Error handling](https://tanstack.com/query/latest/docs/framework/react/guides/error-handling)
- [React Router — errorElement](https://reactrouter.com/api/react-router/errorElement)
