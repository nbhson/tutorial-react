# Error Boundary + Xử lý lỗi

> Nguồn: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary — https://tanstack.com/query/latest/docs/framework/react/guides/error-handling

## Mục tiêu
- Nắm 3 tầng xử lý lỗi: render (Error Boundary), data (Query retry), toàn cục (log + fallback UI).
- Bọc vùng UI bằng `react-error-boundary` có nút thử lại và `resetKeys`.
- Cấu hình TanStack Query không retry lỗi 4xx, phân biệt lỗi mạng vs lỗi client.

## Tổng quan
- Một component throw khi render có thể làm **vỡ cả cây React** nếu không có boundary.
- Error Boundary (class component dùng `getDerivedStateFromError` + `componentDidCatch`) bắt lỗi render/lifecycle của con — tương tự `angular/error-handler` nhưng theo vùng UI.
- Data lỗi (fetch/query) **không nên** nằm trong boundary — xử lý riêng ở tầng query.
- Áp dụng cho: mô-đun remote MF (bài 5/1), widget độc lập, lazy component, query/error boundary.

## Khái niệm cốt lõi
- **Error Boundary bắt gì**: lỗi từ render, lifecycle, constructor của **children** — nhưng **không** bắt: event handler, async code (`setTimeout`, promise ngoài render), `Server Components`/SSR (Next.js cần `global-error.js`), lỗi của chính boundary.
- **Cơ chế**: khi con throw, boundary tìm gần nhất → commit fallback UI (không unmount phần còn lại).
- **`react-error-boundary`**: wrapper class boundary dùng được kiểu hook/khi báo; cung cấp `resetErrorBoundary`, `resetKeys`, `onError`.
- **TanStack Query error**: `isError`, `error`, `retry`, `refetch`; phân biệt lỗi mạng (retry) vs 4xx client (không retry).
- **Route error**: React Router `errorElement` cho loader/action fail (khác lỗi render thường).
- **Log tập trung**: đưa lỗi + `componentStack` vào Sentry; không `console.log` bỏ qua.

## Luồng hoạt động / Cách áp dụng
1. Tạo `AppErrorBoundary` toàn cục (fallback cả trang) + bọc vùng quan trọng riêng.
2. Trong boundary: `onError` gửi Sentry kèm `componentStack`, fallback có nút "Thử lại" (`resetErrorBoundary`), dùng `resetKeys` khi deps lỗi thay đổi.
3. Query: thiết lập `retry` mặc định không đánh 4xx; xử lý message lỗi theo `error.response.status`.
4. Route: khai `errorElement` cho loader/action.
5. Sự kiện/async: try-catch thủ công + set state lỗi riêng (boundary không giúp).

## Ví dụ chi tiết
```tsx
import { ErrorBoundary } from 'react-error-boundary';

// Widget có thể throw — nằm sau boundary
function BrokenWidget({ fail }: { fail: boolean }) {
  if (fail) throw new Error('Widget hỏng!');
  return <p>Widget OK</p>;
}

// Vùng an toàn: lỗi chỉ rơi vào fallback, phần trang còn lại sống
export function SafeSection({ fail }: { fail: boolean }) {
  return (
    <ErrorBoundary
      // fallbackRender nhận error + hàm reset
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>Có lỗi: {error.message}</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
      onError={(error, info) => {
        // Gửi lên Sentry kèm stack component — không chỉ console.log
        void captureException(error, { extra: { componentStack: info.componentStack } });
      }}
      // resetKeys: khi prop thay đổi thì tự reset boundary (không cần bấm)
      resetKeys={[fail]}
    >
      <BrokenWidget fail={fail} />
    </ErrorBoundary>
  );
}
```

```tsx
// Query — không retry lỗi 4xx, chỉ retry lỗi mạng/5xx vài lần
import { QueryClient } from '@tanstack/react-query';

function isClientError(err: unknown): boolean {
  // Lỗi fetch/axios chứa status; 4xx là lỗi từ phía client, retry vô ích
  const status = (err as { status?: number })?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 2 && !isClientError(error), // 401/403/404 → dừng ngay
      staleTime: 30_000,
    },
  },
});
```

```tsx
// Route error (React Router) — loader/action fail hiện 1 UI, không vỡ app
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => loadDashboard(), // ném lỗi nếu API fail
    errorElement: <DashboardError />,    // fallback cho loader/action/render của route
  },
]);
```

## Giải thích từng phần
- `fallbackRender`: render fallback có quyền truy cập `error` + `resetErrorBoundary`.
- `onError`: hook log trước khi fallback hiện — Sentry nhận `componentStack`.
- `resetKeys={[fail]}`: khi `fail` đổi, boundary tự reset — rất tiện khi lỗi do prop quyết định.
- `isClientError`: đọc `status` từ error — 4xx không retry (tiết kiệm request vô ích); mạng/5xx retry.
- `errorElement`: boundary ở cấp route — bao phủ render + loader + action.

## Lỗi thường gặp / Chống chỉ định
- **Dùng Error Boundary cho event handler/async**: không bắt được → dùng try-catch trong handler + set state lỗi.
- **Một boundary to nhất bọc cả app**: mất context, mọi lỗi đều "trắng trang" → chia boundary theo vùng, giữ app-level làm cuối cùng.
- **Retry mặc định cho 4xx**: tràn request với 401/403 → tùy biến `retry` bỏ qua 4xx.
- **Log lỗi chỉ `console.log`**: mất khi production → `onError` gửi Sentry + ghi `componentStack`.
- **Quên `resetKeys`/nút thử lại**: user bị "kẹt" ở fallback vĩnh viễn → luôn tạo đường retry hoặc tự reset.

## Best practices / Mẹo
- Boundary ở 3 mức: app-level (cuối cùng), vùng chức năng (đổi fallback nhẹ), widget độc lập.
- Fallback nên có: message gọn, nút thử lại, (tùy) nút "liên hệ hỗ trợ".
- Thống nhất việc log lỗi qua helper `reportError` (Sentry) — dùng mọi nơi.
- Query: hiện skeleton/empty/error riêng, gộp `isPending`/`isError` vào một thành phần.
- Kết hợp React 19 `<Suspense>` + errorElement: fallback chờ và fallback lỗi tách biệt.

## Bài tập nhỏ
Viết `ErrorBoundary` với fallback có nút "Thử lại" và `resetKeys`. Bọc `ProfileCard` (component render `undefined.length` cố ý throw khi `fail`). Sửa `retry` của query để 409 không retry nhưng 503 retry 3 lần; thêm test xác nhận bằng renderHook + MSW.

## Reference
- [React — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- [TanStack Query — Error handling](https://tanstack.com/query/latest/docs/framework/react/guides/error-handling)
- [React Router — errorElement](https://reactrouter.com/api/react-router/errorElement)