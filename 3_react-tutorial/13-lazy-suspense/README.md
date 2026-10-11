# DAY 13: LAZY + SUSPENSE (MODULE)

## Mục tiêu bài học
- Hiểu code splitting: `lazy()` + `<Suspense>` tách các màn hình nặng (chart, editor) thành chunk riêng, Vite tự lo — tương đương `loadChildren` của Angular Router.
- Nắm vai trò của Error Boundary bọc ngoài Suspense cho trường hợp lazy load thất bại (mất mạng).
- Biết prefetch sớm (hover) để giảm cảm giác chờ đợi.

## Khái niệm cốt lõi (Core)
- **`lazy(() => import("./HeavyChart"))`:** `import()` động là cú pháp ES — Vite nhận diện, tách module đó thành **chunk riêng**. `lazy` bọc component, React chỉ tải chunk **lần đầu component được render**.
- **`<Suspense fallback={<p>Đang tải...</p>}>`:** khai báo UI chờ cho các component suspend (lazy hoặc data fetching với `use()` ở DAY 12) bên trong nó. Không bọc = React lỗi "needs a Suspense boundary".
- **Chu kỳ:** mount → chunk chưa có → suspend → fallback hiện → chunk về → render thật. Sau đó **mỗi lần remount không tải lại** (đã cache).
- **Error Boundary — phần hay quên:** network fail khi tải chunk → `lazy` component *throw lỗi* → cần Error Boundary (class component hoặc `react-error-boundary`) **bên ngoài Suspense** — fallback của Suspense không bắt lỗi.
- **Prefetch:** với route/screen người dùng "hầu như chắc chắn" mở, gọi `import("./HeavyChart")` sớm (hover, idle) — chunk tải trước; khi click, component đã sẵn.
- **Keyword chính:** `lazy`, `Suspense`, `fallback`, `dynamic import`, `code splitting`, `chunk`, Error Boundary, prefetch.

## Luồng hoạt động (Flow)
1. Module `App` chạy: `lazy(() => import("./HeavyChart"))` — **chưa tải gì**, chỉ đăng ký promise.
2. Bundle build: Vite thấy `import("./HeavyChart")` → tách HeavyChart ra chunk `HeavyChart-[hash].js`; `index` chỉ có App + button.
3. User hover nút → `onMouseEnter` gọi `import("./example")` (ví dụ demo prefetch) → trình duyệt bắt đầu tải chunk.
4. User click → `setShow(true)` → React render `<HeavyChart/>` → component "suspend" vì chunk chưa xong.
5. React tìm `<Suspense>` gần nhất → render `fallback` (`Đang tải biểu đồ...`).
6. Chunk về → promise resolve → React render thật `HeavyChart`; fallback biến mất.
7. Nếu mạng lỗi → promise reject → lỗi trồi lên → `ErrorBoundary` bên ngoài bắt → render fallback lỗi ("Tải thất bại, thử lại.").
8. Lần mount sau: chunk đã cache → render ngay, không fallback.
9. Route-level lazy (DAY 14): `lazy: () => import("./pages/Chart")` → React Router tải chunk khi vào route, tự bọc Suspense — không cần viết tay.
10. `resetKeys` của `react-error-boundary`: khi key đổi (vd đổi route), boundary tự reset để thử render lại thay vì kẹt ở fallback lỗi.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 13: lazy + Suspense
import { Suspense, lazy, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Demo: thay "./HeavyChart" bằng component nặng thật (chart/editor)
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        // Prefetch: hover là tải trước chunk — click không phải chờ lâu
        onMouseEnter={() => import("./example")}
        onClick={() => setShow(true)}
      >
        Mở biểu đồ
      </button>
      {show && (
        // ErrorBoundary ngoài Suspense: bắt lỗi tải chunk thất bại
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
```

Route-level lazy với React Router v7 (DAY 14):

```tsx
const router = createBrowserRouter([
  { path: "/chart", lazy: () => import("./pages/Chart") }, // tự split + Suspense
]);
```

Preload thủ công — gọi `import()` sớm, `lazy` dùng lại cache:

```tsx
const loadChart = () => import("./HeavyChart");
const HeavyChart = lazy(loadChart);
// onMouseEnter={loadChart}  -> chunk tải trước khi click
```

## Giải thích từng phần
- `lazy(() => import(...))`: callback **phải return `{ default: Component }`** — `import()` trả module namespace, `lazy` lấy `default`. Trong ví dụ dùng `Promise.resolve` để mô phỏng chunk mà không cần file thật.
- `{show && <Suspense>...}`: render có điều kiện (DAY 2) — chỉ mount Suspense khi người dùng mở — chunk cũng chỉ được yêu cầu lúc này (nếu không prefetch).
- `onMouseEnter={() => import("./example")}`: prefetch — tải chunk **trước khi click**. Kết hợp onClick mới thực sự "ấn tượng mượt".
- Vị trí ErrorBoundary: **bao ngoài Suspense** (không bao trong) — vì lỗi từ `lazy` "ném lên" phải có boundary bên ngoài để bắt; Suspense chỉ bắt trạng thái *pending*, không bắt *error*.
- `react-error-boundary` cung cấp class ErrorBoundary sẵn dùng — không phải tự viết class `componentDidCatch`.
- **`lazy` cache theo module URL:** một khi chunk đã tải, mọi instance `lazy` cùng đường dẫn dùng lại — không tải lại lần 2.
- **Preload helper:** `const p = () => import("./HeavyChart"); const Heavy = lazy(p);` rồi gọi `p()` khi hover — tận dụng cache của `import()`.
- **Nhiều Suspense lồng nhau:** Suspense gần nhất bắt trạng thái pending; đặt boundary nhỏ quanh từng vùng để fallback không "nuốt" cả trang.
- **Suspense + transition:** `useTransition`/`startTransition` giúp giữ UI cũ thay vì nháy fallback khi điều hướng.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `loadChildren: () => import('./x.module')` | `lazy(() => import('./X'))` | Cùng dynamic import ES |
| Lazy route chỉ tải khi vào route | lazy component chỉ tải khi render | React lazy không gắn router — gắn được cả | 
| Router `fallback`/loading outlet | `<Suspense fallback={...}>` | UI chờ chunk |
| `preloadStrategy` (chỉ Router) | `onMouseEnter={() => import(...)}`; Router v7 có prefetch | Không có global preload strategy "built-in" như Angular |
| `@NgModule` tách module lười | file/chunk qua Vite | Không module wrappers |
| Error: chunk fail → custom route error | ErrorBoundary bọc Suspense | Phải bọc đúng chỗ |
| `RouterModule` preloading chiến lược | route `lazy` + preload thủ công | Không có global strategy mặc định |
| `@defer` block (Angular 17+) | `lazy` + `<Suspense>` | Cùng ý tách chunk theo view |
| Route error handler | `ErrorBoundary` + route `errorElement` | Xem DAY 14 |

## Lỗi thường gặp (Common pitfalls)
- **Quên `<Suspense>`** → lỗi "A component suspended while rendering... Add a <Suspense> boundary". → Fix: bọc lazily-loaded component.
- **Suspense không bắt lỗi** — chỉ bắt pending. → Fix: ErrorBoundary **ngoài** Suspense (`react-error-boundary`).
- **`lazy` trả về sai shape** (return module trực tiếp thay vì `{ default }`) → chunk load nhưng component rỗng. → Fix: `lazy(() => import("./X").then(m => ({ default: m.Xxx })))` khi không phải default export.
- **Prefetch ẩu** (`import()` gọi mỗi render) → tải chunk sớm vô ích. → Fix: gọi trong event (hover/onViewVisible) hoặc `React.lazy` kết hợp preload helper thủ công có điều kiện.
- **Bọc mọi thứ trong một Suspense** → khi mất mạng, cả trang fallback; chia nhỏ boundary theo vùng. → Fix: Suspense nhỏ quanh từng vùng lazy.
- **Class component cũ `componentDidCatch` tự viết** lặp code → dùng `react-error-boundary` (fallback, onError, resetKeys).
- **Bọc `lazy` component trong một Suspense quá cao** → cả trang fallback khi tải một widget. → Fix: đặt Suspense sát component lazy.
- **Tự viết `componentDidCatch` cho mọi nơi** → lặp code, khó reset. → Fix: dùng `react-error-boundary` + `resetKeys`.
- **Giả định `lazy` trả component đồng bộ** → luôn bất đồng bộ; UI phải có fallback. → Fix: luôn bọc Suspense + test mạng chậm.

## Best practices / Mẹo
- **Phân đoạn theo route/màn hình** (chunk per route) là chính; lazy thêm cho widget nặng nội trang (chart, editor, map).
- Kết hợp với Data Router (DAY 14): route có `lazy: () => import(...)` — React Router v7 tự lo chunk + suspense cho route; không cần thủ công.
- Với TanStack Query, **không** cần fetch data trong `lazy` chunk — dữ liệu đi qua query; chunk chỉ mang component.
- Đo lường: `npm run build` → xem báo cáo chunk kích thước (`--report`/vite visualizer); mục tiêu giữ `index` nhỏ, các screen tách chunk.
- **Fallback nên nhỏ** (spinner dòng) — fallback quá to sẽ "nháy" khi tải nhanh.
- **Tách chunk theo route trước, widget sau** — chunk route thường lớn và có ích nhất khi code splitting.
- **Prefetch khi hover/focus/idle** (`requestIdleCallback`) — tải trước mà không chặn tương tác chính.
- **Theo dõi kích thước chunk** ở CI (vite visualizer) để phát hiện chunk phình bất ngờ.

## Bài tập nhỏ
1. Tạo thư mục `src/pages` với 3 trang (Home, About, Chart) và dùng `lazy` + `Suspense` quanh `<ChartPage/>`, bấm nút chuyển trang — xem Network tab thấy chunk tải riêng từng trang.
2. Thêm nút "Mở biểu đồ" thứ hai không có `onMouseEnter`; so sánh thời gian chờ với nút có prefetch — ghi lại cảm nhận trải nghiệm.
3. Bọc một widget nặng bằng `Suspense` riêng và mô phỏng lỗi tải (reject promise) để thấy ErrorBoundary render fallback.
4. Dùng `resetKeys` của `react-error-boundary` để nút "Thử lại" render lại component sau khi lỗi.
5. Tạo route lazy bằng React Router v7 (`lazy: () => import(...)`) và quan sát chunk tải khi vào route (DAY 14).

## Reference
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense
- https://react.dev/reference/react-dom/client/hydrateRoot (SSR không cần trong tutorial này)
- https://www.npmjs.com/package/react-error-boundary