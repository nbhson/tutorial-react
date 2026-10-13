# DAY 13: LAZY + SUSPENSE (MODULE)

## Mục tiêu bài học
- Hiểu code splitting: `lazy()` + `<Suspense>` tách các màn hình nặng (chart, editor) thành chunk riêng, Vite tự lo — tương đương `loadChildren` của Angular Router.
- Nắm vai trò của Error Boundary bọc ngoài Suspense cho trường hợp lazy load thất bại (mất mạng).
- Biết prefetch sớm (hover/focus/idle) để giảm cảm giác chờ đợi.

## Khái niệm cốt lõi (Core)

### 1. `lazy(() => import("./HeavyChart"))` — tách chunk, tải khi render
`import()` động là cú pháp ES — Vite nhận diện lúc build, tách module đó thành **chunk riêng** (`HeavyChart-[hash].js`), `index` nhẹ. `lazy` bọc component: React chỉ tải chunk **lần đầu component được render** (không phải lúc `lazy()` gọi). Sau đó cache theo URL module — remount không tải lại.

```tsx
// Prod thật (example dùng Promise.resolve để demo không cần file thật):
const HeavyChart = lazy(() => import("./HeavyChart"));
// Build: index.js (App + nút) + HeavyChart-[hash].js (chart lib nặng)
// Chưa bấm "Mở" là chưa tải chart lib — mở lần đầu mới tải, lần sau dùng cache
```

Vì sao callback phải trả `{ default: Component }`? Vì `import()` trả module namespace (`{ default, Chart, ... }`), `lazy` lấy `.default`. Component export named (`export function Chart`) mà không default thì `lazy(() => import("./X"))` cho component rỗng — phải `.then(m => ({ default: m.Chart }))`. Quy tắc: file lazy luôn `export default` để khỏi `.then`.

### 2. `<Suspense fallback>` — UI chờ cho suspend
Khai báo UI chờ cho mọi component suspend (lazy chưa tải xong, hoặc `use()` data chưa resolve DAY 12) bên trong nó. Không bọc là React lỗi "A component suspended... Add a <Suspense> boundary". Chu kỳ: mount → chunk chưa có → suspend → fallback hiện → chunk về → render thật.

```tsx
<Suspense fallback={<p>Đang tải biểu đồ...</p>}>
  <HeavyChart />
</Suspense>
// Fallback nhỏ (spinner dòng) — to quá sẽ "nháy" khi tải nhanh (100ms cũng hiện rồi mất)
```

Vì sao Suspense gần nhất bắt? Vì React tìm boundary gần nhất phía trên để hiện fallback. Bọc cả app trong 1 Suspense là sai: tải 1 widget mà cả trang fallback. Đặt Suspense sát component lazy (mỗi vùng lazy một boundary) — vùng nào chờ thì vùng đó spinner.

### 3. Error Boundary — phần hay quên (bắt lỗi, không phải chờ)
Mất mạng khi tải chunk → `lazy` promise reject → component *throw lỗi* (không phải suspend). `fallback` của Suspense **không bắt lỗi**, chỉ bắt pending. Cần Error Boundary (class `componentDidCatch` hoặc `react-error-boundary`) **bên ngoài Suspense** để bắt và hiện fallback lỗi + nút thử lại.

```tsx
// example.tsx đúng: Boundary NGOÀI, Suspense TRONG
<ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
  <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
    <HeavyChart />
  </Suspense>
</ErrorBoundary>
// Đảo lại (Suspense ngoài Boundary trong) là sai: lỗi từ lazy ném qua Suspense (không bắt)
// trồi lên trên, trang trắng. Nhớ: pending -> Suspense, error -> Boundary ngoài.
```

`react-error-boundary` cho sẵn `fallback`, `onError` (log), `resetKeys` (đổi key là thử lại, không kẹt fallback). Không tự viết class mỗi nơi.

### 4. Prefetch — tải trước khi cần
Với màn "hầu như chắc mở" (user hover nút Chart), gọi `import("./HeavyChart")` sớm (hover/focus/idle). Chunk tải trước; click sau render ngay. `lazy` dùng lại cache của `import()` — không tải 2 lần.

```tsx
// example.tsx: helper + 2 trigger (chuột + bàn phím)
const preloadChart = () => import("./example"); // thật: import("./HeavyChart")
const HeavyChart = lazy(() => import("./HeavyChart")); // cùng URL -> cùng cache
<button onMouseEnter={preloadChart} onFocus={preloadChart} onClick={() => setShow(true)}>
```

Vì sao `onFocus` nữa? Vì chỉ `onMouseEnter` là bỏ qua keyboard user (Tab tới nút không preload, Enter vẫn chờ). Prefetch ẩu (gọi mỗi render, preload mọi thứ lúc mở app) thì mất ý nghĩa split — chỉ preload khi tín hiệu mạnh (hover/focus/viewport/idle) và chunk lớn.

### Keyword chính
`lazy` (bọc, cần default), `Suspense`/`fallback` (UI chờ pending), dynamic `import()` (tách chunk), chunk/cache theo URL, Error Boundary (bắt error tải, bọc ngoài), prefetch (`onMouseEnter`/`onFocus`/idle), route `lazy` (DAY 14).

## Luồng hoạt động (Flow)
1. Module `App` chạy: `lazy(() => import(...))` — **chưa tải gì**, chỉ đăng ký promise + cache key theo URL. `preloadChart` cũng chỉ là hàm, chưa gọi.
2. Build: Vite thấy `import("./HeavyChart")` → tách `HeavyChart-[hash].js`; `index` chỉ App + nút. `npm run build` xem báo cáo chunk để biết index nhẹ bao nhiêu.
3. User hover/focus nút → `preloadChart()` → trình duyệt tải chunk nền. Chưa `setShow` nên chưa render `HeavyChart` — chỉ tải trước.
4. User click → `setShow(true)` → React render `<HeavyChart/>` → chunk chưa xong (nếu không preload) thì component "suspend".
5. React tìm `<Suspense>` gần nhất → render `fallback` ("Đang tải biểu đồ..."). Vùng khác ngoài Suspense vẫn tương tác bình thường.
6. Chunk về → promise resolve `{ default }` → React render thật `HeavyChart`; fallback biến mất. Không có JS animation nào — chỉ thay element.
7. Mất mạng → promise reject → lỗi ném lên → `ErrorBoundary` ngoài bắt → fallback lỗi ("Tải thất bại, thử lại.") + `resetKeys` cho thử lại. Suspense không tham gia bước này.
8. Lần mount sau (đóng/mở lại): chunk cache → render ngay, không fallback. Kiểm tra Network tab: lần 2 không request chunk nữa.
9. Route-level (DAY 14): `lazy: () => import("./pages/Chart")` → Router tải chunk khi vào route, tự bọc Suspense — không viết tay mỗi trang.
10. `resetKeys` (ví dụ `[show]`): đổi key là boundary reset, thử render lại thay vì kẹt fallback lỗi cũ.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx`:

```tsx
// example.tsx — DAY 13: lazy + Suspense + ErrorBoundary + prefetch (khớp README)
// Mục đích: chunk nặng chỉ tải khi cần; fallback chờ; boundary bắt lỗi tải; hover tải trước.
import { Suspense, lazy, useState } from "react"; // (1) lazy tách chunk, Suspense khai UI chờ
import { ErrorBoundary } from "react-error-boundary"; // (2) Bắt lỗi tải chunk (Suspense chỉ bắt pending, không bắt error)

// (3) Demo: thay Promise.resolve bằng import("./HeavyChart") thật.
// lazy yêu cầu callback trả { default: Component } — import() trả module, lazy lấy .default.
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);
// Prod thật: const HeavyChart = lazy(() => import("./HeavyChart"));
// - Vite thấy import("./HeavyChart") -> tách HeavyChart-[hash].js riêng, index nhẹ.
// - Chưa render là chưa tải; lần đầu render mới tải; sau đó cache, remount không tải lại.

// (4) Preload helper: gọi import() sớm (hover/idle), lazy dùng lại cache khi render thật.
const preloadChart = () => import("./example"); // demo trỏ lại file này; thật là import("./HeavyChart")

export default function App() {
  const [show, setShow] = useState(false); // (5) Điều kiện mount — chunk chỉ yêu cầu khi show true (nếu chưa preload)
  return (
    <>
      <button
        // (6) Prefetch: hover là tải trước chunk — click sau không chờ lâu. Gọi trong event, không mỗi render.
        onMouseEnter={preloadChart}
        onFocus={preloadChart} // keyboard focus cũng preload (a11y, không chỉ chuột)
        onClick={() => setShow(true)}
      >
        Mở biểu đồ
      </button>
      {/* (7) Render có điều kiện (DAY 2): chỉ mount Suspense khi mở */}
      {show && (
        // (8) ErrorBoundary NGOÀI Suspense: lỗi tải chunk (mất mạng) ném lên, boundary bắt -> fallback lỗi.
        // Đảo lại (Suspense ngoài) là sai: Suspense không bắt error, lỗi trồi qua, trang trắng.
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          {/* (9) Suspense fallback nhỏ (spinner dòng) — chunk về thì thay bằng HeavyChart thật */}
          <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}

// Ghi chú route-level (DAY 14, không chạy ở đây):
// const router = createBrowserRouter([{ path: "/chart", lazy: () => import("./pages/Chart") }]);
// Router tự split + Suspense theo route — không viết tay lazy/Suspense mỗi trang.
```

Route-level lazy với React Router v7 (chi tiết DAY 14):

```tsx
import { createBrowserRouter } from "react-router";
const router = createBrowserRouter([
  { path: "/chart", lazy: () => import("./pages/Chart") }, // tự split + Suspense theo route
]);
```

Preload thủ công tái dùng cache (mẫu gọn):

```tsx
const loadChart = () => import("./HeavyChart"); // 1 URL duy nhất
const HeavyChart = lazy(loadChart); // lazy dùng cùng promise/cache
// <button onMouseEnter={loadChart} onClick={open}> — hover tải, click dùng lại
```

## Giải thích từng phần
- Dòng `lazy(() => Promise.resolve({ default: ... }))`: demo không cần file thật. Vì sao shape `{ default }`? Vì `lazy` lấy `.default` làm component. Prod thay bằng `import("./HeavyChart")` (trả module có `.default` nếu file export default).
- Dòng `{show && <Suspense>...}`: điều kiện (DAY 2) — chỉ mount khi mở nên chunk chỉ yêu cầu lúc mở (trừ preload). Không có là chunk tải ngay lúc mở app, mất ý split.
- Dòng `onMouseEnter={preloadChart}` + `onFocus`: prefetch 2 kênh (chuột + bàn phím). Vì sao không gọi trong render (`preloadChart()` ở body)? Vì render chạy mỗi lần state đổi — gọi mỗi render là tải ngay lúc mở app, split vô nghĩa. Chỉ gọi trong event có tín hiệu (hover/focus/idle/viewport).
- Vị trí Boundary ngoài Suspense: lỗi `lazy` ném lên phải gặp Boundary trước khi trồi khỏi Suspense. Vì sao Suspense không bắt? Vì Suspense chỉ đăng ký "pending" (promise chưa xong), không đăng ký "error" (promise reject). Hai kênh khác nhau.
- Dòng `react-error-boundary`: cung cấp Boundary function-ready (không cần class `componentDidCatch` tay) với `fallback` (UI lỗi), `onError` (log lên Sentry), `resetKeys` (đổi là thử lại). Dùng cho mọi lazy, không chỉ demo.
- Quy tắc **cache theo URL**: 2 `lazy(() => import("./HeavyChart"))` cùng URL dùng 1 chunk. `preloadChart` + `lazy` cùng URL nên preload rồi click không tải lại. Đổi query (`./HeavyChart?v=2`) là URL khác → tải lại.
- Quy tắc **Suspense nhỏ**: mỗi widget nặng một boundary riêng. Vì sao? Để tải chart thì chỉ vùng chart spinner, bảng bên cạnh vẫn dùng được. Một Suspense bọc cả trang là cả trang spinner khi 1 widget chậm.
- Quy tắc **Suspense + transition**: `useTransition`/`startTransition` khi điều hướng (DAY 14) để giữ UI cũ thay vì nháy fallback. Không có là click link nào cũng nháy loading dù chunk gần xong.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `loadChildren: () => import('./x.module')` (lazy route) | `lazy(() => import('./X'))` (lazy component) | Cùng dynamic import ES; React không gắn router, gắn được cả widget |
| Lazy route chỉ tải khi vào route | lazy component chỉ tải khi render (hoặc route `lazy` DAY 14) | React linh hoạt hơn (route + widget) |
| Router loading outlet/fallback | `<Suspense fallback={...}>` | UI chờ chunk, đặt sát lazy |
| `PreloadAllModules`/`preloadStrategy` (Router) | `onMouseEnter/onFocus={() => import(...)}`; Router v7 prefetch flag | Không global strategy built-in, tự preload theo tín hiệu |
| `@NgModule` tách module lười (wrapper) | file/chunk qua Vite (không wrapper) | Không module ceremony |
| Chunk fail → custom route error | ErrorBoundary bọc NGOÀI Suspense | Phải đúng thứ tự, Suspense không bắt lỗi |
| `RouterModule` preloading chiến lược | route `lazy: () => import(...)` + preload tay | Không mặc định, tự chọn |
| `@defer` block (Angular 17+: defer theo viewport/idle) | `lazy` + `<Suspense>` + preload idle/viewport tay | Cùng ý trì hoãn tải theo điều kiện |
| Route error handler | `ErrorBoundary` + route `errorElement` (DAY 14) | Lỗi tải chunk route cũng qua boundary |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên `<Suspense>` → lỗi suspend không boundary
```tsx
// ❌ SAI: lazy không bọc — React ném "A component suspended... Add a <Suspense> boundary"
const Heavy = lazy(() => import("./Heavy"));
return <Heavy />;
```
```tsx
// ✅ ĐÚNG: bọc sát lazy với fallback nhỏ
return <Suspense fallback={<p>Đang tải...</p>}><Heavy /></Suspense>;
```

### 2. Tưởng Suspense bắt lỗi tải → trang trắng khi mất mạng
```tsx
// ❌ SAI: chỉ Suspense, không Boundary — reject trồi qua, trắng trang
<Suspense fallback={<p>Chờ...</p>}><Heavy /></Suspense>
```
```tsx
// ✅ ĐÚNG: Boundary NGOÀI Suspense (như example)
<ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
  <Suspense fallback={<p>Chờ...</p>}><Heavy /></Suspense>
</ErrorBoundary>
```

### 3. `lazy` sai shape (named export không map)
```tsx
// ❌ SAI: file export function Chart (named), lazy lấy .default -> undefined, render trắng
// HeavyChart.tsx: export function Chart() {...}
const Heavy = lazy(() => import("./HeavyChart"));
```
```tsx
// ✅ ĐÚNG: map sang default, hoặc đổi file sang export default
const Heavy = lazy(() => import("./HeavyChart").then((m) => ({ default: m.Chart })));
// Tốt nhất: // HeavyChart.tsx: export default function HeavyChart() {...}
```

### 4. Prefetch ẩu (mỗi render / preload tất cả)
```tsx
// ❌ SAI: gọi trong render — tải ngay lúc mở app, split vô nghĩa
function App() { preloadChart(); return <button>Mở</button>; }
```
```tsx
// ✅ ĐÚNG: gọi trong event có tín hiệu (hover/focus/idle/viewport)
<button onMouseEnter={preloadChart} onFocus={preloadChart} onClick={open}>Mở</button>
```

### 5. Một Suspense bọc cả trang → tải 1 widget cả trang spinner
```tsx
// ❌ SAI: chart chậm là dashboard trắng hết
<Suspense fallback={<BigSpinner />}><Dashboard /><HeavyChart /><Table /></Suspense>
```
```tsx
// ✅ ĐÚNG: boundary nhỏ quanh lazy
<Dashboard /><Suspense fallback={<SmallSpinner />}><HeavyChart /></Suspense><Table />
```

### 6. Tự viết `componentDidCatch` mỗi nơi → lặp + khó reset
Mô tả: class Boundary tay thiếu `resetKeys`/`onError` chuẩn. Fix: `react-error-boundary` + `resetKeys={[show, location.pathname]}` để đổi route/show là thử lại, `onError` log Sentry.

## Best practices / Mẹo
- **Split theo route trước, widget nặng sau** (chart/editor/map). Vì sao thứ tự? Vì chunk route lớn nhất + ít vào cùng lúc — giảm index nhiều nhất. Widget chỉ khi đo thấy nặng.
- Data Router (DAY 14) route `lazy: () => import(...)` — Router tự chunk + suspense. Vì sao dùng? Để không viết tay `lazy`/`Suspense` mỗi trang, Router lo đồng bộ tải chunk + loader.
- Dữ liệu qua TanStack Query, không fetch trong chunk lazy. Vì sao tách? Vì chunk là code, query là data — gộp là vào route nào cũng fetch dù cache có.
- Đo: `npm run build` xem chunk size (visualizer). Mục tiêu index nhỏ, screen tách. Vì sao đo? Vì split mù (lazy mọi thứ nhỏ) tăng request mà không giảm index đáng kể.
- Fallback nhỏ (spinner dòng/skeleton dòng). Vì sao nhỏ? Vì tải nhanh (100ms) mà fallback to là nháy khó chịu; nhỏ thì gần như không thấy.
- Prefetch hover/focus/idle (`requestIdleCallback`)/viewport (IntersectionObserver). Vì sao nhiều kênh? Vì hover chỉ chuột, focus cho keyboard, idle cho "chắc chắn cần", viewport cho dưới màn hình.

## Bài tập nhỏ
1. Tạo `src/pages` (Home/About/Chart), `lazy` + `Suspense` quanh Chart, bấm chuyển — Network tab thấy chunk riêng từng trang. Ghi size index trước/sau split.
2. Hai nút "Mở biểu đồ": một có `onMouseEnter` preload, một không — throttling mạng Slow 3G, so thời gian chờ. Vì sao preload thắng?
3. Bọc widget bằng Suspense riêng + ép reject (`lazy(() => Promise.reject(...))`) — quan sát Boundary fallback (không phải Suspense fallback). Đảo Boundary vào trong, quan sát trắng trang.
4. `resetKeys` để "Thử lại" render lại sau lỗi — không có là kẹt fallback dù mạng đã lại.
5. Route lazy Router v7 (`lazy: () => import(...)`) — quan sát chunk khi vào route (kết hợp DAY 14).

## Reference
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense
- https://www.npmjs.com/package/react-error-boundary
