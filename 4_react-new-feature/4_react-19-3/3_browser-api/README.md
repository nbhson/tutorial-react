# 3. browser() API

## Mô tả
- `browser()` là API mới **stable từ React 19.3** (09/2026), thuộc **`react-dom`** (KHÔNG phải `react`). Dùng kèm `use`: `use(browser())`.
- Mục đích: **đánh dấu một component là "browser-only"** khi app có server rendering. Trên server → component **suspend** (Suspense boundary gần nhất hiển thị fallback trong HTML); trên client → `use(browser())` trả `undefined` và component render bình thường.
- Nó là API **first-class** thay cho các mẹo cũ: `typeof window !== 'undefined'`, hay `useState(false)` + `useEffect(() => setMounted(true))`.

> ⚠️ Hay nhầm: `browser()` **không trả về** thông tin trình duyệt (UA, viewport, locale...). Nó trả về một **opaque value** chỉ dùng để đánh dấu opt-out SSR. Muốn đọc `matchMedia`/`localStorage`/timezone thì **sau khi** `use(browser())` mới đọc trực tiếp API của browser.

## Mục tiêu
- Dùng `use(browser())` để opt-out server rendering cho component phụ thuộc API chỉ có ở browser.
- Hiểu cơ chế **suspend trên server / không suspend trên client** và vai trò bắt buộc của `<Suspense>`.
- Dùng `browser()` **có điều kiện** (trong `if`/sau early return) và truyền `reason` để báo cáo qua `onBrowserBailout`.

## Vấn đề giải quyết
- Component đọc `localStorage`, timezone của máy, hay `window.matchMedia` **ngay trong render**: server không có `window` → hydration mismatch, hoặc phải render 2 lần gây nháy nội dung.
- `typeof window` chỉ che được một phần: vẫn phải chờ effect để có UI đúng → nhấp nháy (flicker).
- Không có cách chuẩn để nói với framework "component này đừng render trên server". `browser()` chuẩn hoá việc này và **tích hợp với Suspense** thay vì hack.

## Khái niệm cốt lõi
- **`use(browser())`** là cách dùng chuẩn: `browser()` **một mình không có tác dụng**, phải đưa giá trị nó trả về vào `use`.
- **Trên server**: `use(browser())` dừng render component → React để lại **fallback của `<Suspense>` gần nhất** trong HTML.
- **Trên client**: `use(browser())` trả `undefined` → component render tiếp bình thường.
- **Bắt buộc có `<Suspense>`** bao quanh khi server render, nếu không **server render sẽ fail**.
- **Bắt buộc là Client Component**: gọi trong module có `'use client'`; không gọi trong Server Component.
- **`reason` (tùy chọn)**: string hoặc hàm, mô tả *vì sao* cần render ở browser. String/giá trị hàm trả về trở thành `cause` của `Error` báo cho `onBrowserBailout`. Nếu tạo `reason` đắt, truyền hàm `() => new Error(...)` để trì hoãn.
- **Có điều kiện**: như các lời gọi `use` khác, `use(browser())` được gọi trong `if`/sau early return — hữu ích để opt-out SSR có điều kiện (ví dụ Hook data-fetching chỉ opt-out khi thiếu `initialData`).

## Cú pháp / API

```tsx
import { use } from 'react';
import { browser } from 'react-dom'; // chú ý: react-dom, KHÔNG phải react

function BrowserOnly() {
  use(browser('Component này cần API của browser.'));
  return <BrowserContent />;
}
```

Chữ ký:

```
use(browser(reason?)) : undefined   // trên client
                     : suspend      // trên server
```

- **Tham số** `reason` (tùy chọn): string hoặc hàm. Trở thành `cause` của `Error` cho `onBrowserBailout`. Hàm `reason` được React gọi mỗi lần server renderer gặp giá trị, **không** gọi ở browser.
- **Trả về**: opaque value; khi truyền cho `use` ở browser thì `use` trả `undefined`.
- **Caveat**: phải nằm trong `<Suspense>` khi SSR; phải thuộc Client Component; gọi `browser()` một mình vô tác dụng; **đừng `throw`** giá trị đó.

Báo cáo trên server (tùy chọn):

```tsx
import { renderToPipeableStream } from 'react-dom/server';

renderToPipeableStream(<App />, {
  onShellReady() {
    pipe(response);
  },
  onBrowserBailout(error, errorInfo) {
    // error.cause = reason bạn truyền cho browser(...)
    logBrowserBailout(error, errorInfo);
  },
});
```

## Luồng hoạt động (Flow)
1. Server render component → gặp `use(browser())` → **suspend**.
2. React đặt **fallback của `<Suspense>` gần nhất** vào HTML ban đầu (shell gửi đi ngay).
3. Client hydrate: `use(browser())` **không** suspend, trả `undefined` → component render tiếp, đọc `localStorage`/timezone/`matchMedia`.
4. Nếu có `reason` + `onBrowserBailout`, server báo lại việc bailout để bạn log (không tính là `onError`).

## Ví dụ chi tiết

```tsx
// example.tsx — timezone chỉ đọc được ở browser, SSR dùng fallback
'use client';
import { Suspense, use } from 'react';
import { browser } from 'react-dom';

function TimeZone() {
  // SSR: suspend → fallback. Client: trả undefined rồi đọc API browser thật.
  use(browser('No default time zone was provided.'));
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <p>Múi giờ: {timeZone}</p>;
}

export default function BrowserApiDemo() {
  return (
    <div>
      <h2>browser() API (React 19.3)</h2>
      <Suspense fallback={<p>Đang xác định múi giờ...</p>}>
        <TimeZone />
      </Suspense>
      <p>
        <small>
          Trước 19.3 phải useEffect + useState 2-pass gây nháy; browser() cho
          component chỉ chạy ở browser, SSR tự dùng fallback.
        </small>
      </p>
    </div>
  );
}
```

Ví dụ **có điều kiện** (opt-out chỉ khi thiếu `initialData`):

```tsx
function useBrowserQuery(query, options) {
  if (options.initialData === undefined) {
    use(browser('useBrowserQuery: No initial data was provided.'));
  }
  return useQuery(query, options);
}
```

## Giải thích từng phần
- `'use client'` — **bắt buộc**: `use(browser())` không dùng được trong Server Component.
- `import { browser } from 'react-dom'` — **không** import từ `react`. Đây là API của React DOM.
- `use(browser('...'))` — gọi `browser` kèm reason, rồi đưa giá trị cho `use`. Trên client `use` trả `undefined`; ta **không dùng** giá trị đó, nó chỉ đánh dấu browser-only.
- `new Intl.DateTimeFormat().resolvedOptions().timeZone` — chỉ chạy được ở client, sau khi đã opt-out SSR.
- `<Suspense fallback={...}>` — thiếu boundary này thì server render **fail**; fallback chính là nội dung HTML nhìn thấy trước khi hydrate.
- Ở ví dụ có điều kiện: khi `initialData` **có**, không gọi `use(browser())` → server render bình thường; khi **không có**, mới opt-out.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (19.3) | Lợi ích |
|---|---|---|
| `typeof window !== 'undefined'` | `use(browser())` | First-class, tích hợp Suspense |
| `useState(false)` + `useEffect(() => setMounted(true))` | `use(browser())` | Không nháy 2-pass, không effect thừa |
| Framework option tắt SSR cho cả trang | `use(browser())` cho **từng component** | Opt-out cục bộ, giữ SSR phần còn lại |
| Không có cách báo cáo | `onBrowserBailout` + `reason` | Quan sát được component nào bị bailout |

## Lỗi thường gặp
1. **Thiếu `<Suspense>` bao quanh** → server render fail. Vì sao: `use(browser())` cần boundary để đặt fallback. Fix: bọc trong `<Suspense fallback={...}>`.
2. **Gọi `browser()` mà không đưa vào `use`** → không có tác dụng. Vì sao: `browser()` chỉ trả opaque value. Fix: `use(browser())`.
3. **Dùng trong Server Component** → lỗi. Vì sao: API chỉ dành cho client. Fix: thêm `'use client'` hoặc chuyển sang Client Component con.
4. **`throw browser()`** → sai. Vì sao: không phải cơ chế throw; React muốn bạn `use` nó. Fix: `use(browser())`.
5. **Tưởng `browser()` trả object thông tin thiết bị** → không phải. Vì sao: giá trị trên client là `undefined`; nó chỉ là "cờ" opt-out SSR. Fix: đọc `window.matchMedia`/`Intl`/`localStorage` sau khi `use(browser())`.
6. **Dùng `browser()` cho analytics/security cần UA chính xác** → không phù hợp. Fix: đọc header ở server.

## Khi nào dùng / Khi nào không
- **Dùng**: component đọc `localStorage`/`sessionStorage`, timezone/hiển thị theo locale thiết bị, `matchMedia`, API chỉ có ở browser; Hook data-fetching cần opt-out SSR khi thiếu `initialData`.
- **Không dùng**: khi component render được trên server (hãy để SSR); thay thế feature-detection đầy đủ; khi cần UA chính xác cho analytics/bảo mật (đọc header phía server).

## Bài tập nhỏ
- Viết `SavedDraft()` dùng `use(browser())` rồi khởi tạo state bằng `localStorage.getItem('draft')`, cho phép sửa và ghi lại `localStorage`. Bọc trong `<Suspense fallback={<p>Loading draft...</p>}>`. Kiểm tra: khi SSR, HTML ban đầu chứa fallback; sau hydrate hiện nội dung đã lưu. Sau đó thử **bỏ `<Suspense>`** để thấy server render fail.

## Reference
- [React 19.3 Release — browser](https://react.dev/blog/2026/09/09/react-19-3)
- [browser reference](https://react.dev/reference/react-dom/browser)
- [use](https://react.dev/reference/react/use)
