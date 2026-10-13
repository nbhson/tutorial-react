# Advanced Features — Tổng quan

> Nguồn: https://react.dev/reference/react/lazy — https://react.dev/reference/react/Suspense — https://tanstack.com/query/latest — https://zustand.docs.pmnd.rs/

Nhóm này cover các **tính năng nâng cao** giúp app React 19 cấp production: tối ưu bundle đầu, hoạt động offline, tách client/server state, state toàn cục có kiểm chứng cho app lớn, tính toán nền không block UI, và bảo vệ route + animation chuyển cảnh.

## Nhóm này giải quyết gì

Sáu vấn đề thường trực của một SPA khi lên production:

1. **Bundle phình to** — user mở trang đăng nhập cũng phải tải code dashboard chưa dùng → cần tách code.
2. **Mất mạng là chết app** — web thường vô dụng khi offline → cần service worker + cache.
3. **State lẫn lộn** — nhét hết dữ liệu API vào global store gây desync, tự viết cache/retry thủ công → cần phân biệt client/server state.
4. **State toàn cục thiếu kiểm chứng** — app lớn nhiều team, cần audit mọi thay đổi, time-travel debug, undo → cần Redux Toolkit.
5. **UI đứng hình** — tác vụ nặng (parse, mã hóa, xử lý ảnh) block main thread → cần chạy ở thread riêng.
6. **Routing thiếu an toàn và khô khan** — route không được bảo vệ flash nội dung, chuyển trang vụt cứng → cần guard + animation.

## Khi nào cần

- App đã có nhiều route/màn hình, bundle đầu > 150–200KB gzip → **bài 1**.
- Người dùng dùng trên mạng kém / muốn cài như native app → **bài 2**.
- Dữ liệu đến từ API, cần cache/refetch/invalidate; state UI phức tạp → **bài 3** (dùng cho hầu hết app trung bình trở lên).
- Muốn đào sâu nửa Zustand của bài 3 (selector, async, middleware, tổ chức) → **bài 7**.
- App lớn/nhiều team, cần DevTools time-travel, audit action, undo → **bài 6** (Redux Toolkit).
- Có tác vụ > ~16ms lặp lại, xử lý dữ liệu lớn phía client → **bài 4**.
- App có phân quyền (auth/role) và muốn trải nghiệm điều hướng mượt → **bài 5**.

## Các bài con

| # | Bài | Nội dung |
|---|---|---|
| 1 | [1-lazy-dynamic-import/](1-lazy-dynamic-import/README.md) | **Lazy + Dynamic Import**: `React.lazy` + `Suspense` tách bundle theo route/component, `import()` động tải theo điều kiện runtime, prefetch, ErrorBoundary cho chunk lỗi. Chỉ tải component/thư viện nặng (chart, editor, PDF) khi thực sự cần, cải thiện LCP/TTI. |
| 2 | [2-pwa-offline/](2-pwa-offline/README.md) | **PWA Offline**: `vite-plugin-pwa` + Workbox, service worker lifecycle, cache-first/network-first/StaleWhileRevalidate, manifest + nút cài đặt, badge online/offline qua `useSyncExternalStore`. Chọn đúng chiến lược cache theo loại tài nguyên. |
| 3 | [3-store-zustand-tanstack-query/](3-store-zustand-tanstack-query/README.md) | **Two-state split**: client state (UI/auth/cart) bằng Zustand v5 (selector, `persist`), server state bằng TanStack Query v5 (`queryKey`, `staleTime`, `useMutation` + `invalidateQueries`, optimistic update). Tránh copy server data vào store. |
| 4 | [4-web-worker/](4-web-worker/README.md) | **Web Worker**: đẩy tính toán nặng (parse, mã hóa, xử lý ảnh) ra thread riêng, `postMessage` + structured clone/transferable, Comlink, dọn dẹp `terminate`. Worker không có DOM — chỉ tính toán rồi gửi kết quả về main thread. |
| 5 | [5-routing-animation-guard/](5-routing-animation-guard/README.md) | **Routing Animation + Guard**: React Router v7 `loader` redirect chặn trước render, `RequireAuth`/`RequireRole` + `<Navigate>`, `AnimatePresence mode="wait"` + Motion fade/slide key theo pathname, `prefers-reduced-motion`. Guard ở loader không flash; guard component nhanh nhưng vẫn vẽ 1 khung. |
| 6 | [6-redux-toolkit/](6-redux-toolkit/README.md) | **Redux Toolkit (mini-track 5 bài)**: `1-slice-store` (slice + store + typed hooks) → `2-async-thunk` (pending/fulfilled/rejected) → `3-entity-adapter` (chuẩn hóa collection) → `4-rtk-query` (fetch hợp nhất, chọn với TanStack) → `5-devtools-persist` (time-travel, listener, persist). Dành cho app lớn cần audit/time-travel/undo; app vừa dùng bài 3. |
| 7 | [7-zustand/](7-zustand/README.md) | **Zustand (mini-track 4 bài)**: `1-create-selectors` (create, selector, `useShallow`) → `2-async-actions` (fetch + optimistic tay) → `3-middleware-persist` (persist/devtools/immer) → `4-slices-pattern` (tách domain, một store nhiều file). Bản chi tiết của nửa Zustand trong bài 3. |

## Thứ tự đọc gợi ý

```
3 (state) → 7 (zustand sâu, khi cần) → 6 (redux, khi cần) → 1 (bundle) → 2 (offline) → 4 (worker) → 5 (routing)
```

Lý do: `3` là nền dữ liệu cho mọi app (dùng lại ở nhiều bài khác); `7` đào sâu nửa Zustand của bài 3; `6` là nhánh nâng cấp khi app vượt quy mô Zustand (đọc sau bài 3 để so sánh trực tiếp); `1` tối ưu tải ban đầu; `2` và `4` là các năng lực nền (offline, tính toán nền); `5` tổng hợp ở tầng điều hướng và thường cần biết cả state (3) lẫn lazy (1) để phối hợp. Nếu chỉ cần một bài, hãy vào trực tiếp theo "Khi nào cần".

## Liên quan tới bài nào khác

- **Bài 1 (lazy)** dùng lại ở nhóm `3_performance-optimization/3-code-splitting` (chiến lược chia chunk, prefetch) và `5_routing-animation-guard` (page mới vào không chờ chunk).
- **Bài 2 (PWA)** ở DevTools có thể đo và tối ưu qua nhóm `6_dev-tools/4-devtools-perf`.
- **Bài 3 (Zustand + Query)** là kiến thức nền cho `2_architecture-patterns/2-container-presentational` và `2-mvvm-hooks` (viewmodel gọi query), và cho `4_deferred-transition` khi cần chọn nơi đặt state.
- **Bài 4 (Web Worker)** kết hợp TanStack Query (`setQueryData`) từ bài 3 và đo long task bằng `6_dev-tools/4`.
- **Bài 5 (routing guard)** liên hệ `4_security-config/4-auth-httpOnly-cookie` (quyền thật ở server, không tin localStorage) và `8_best-practices/2-accessibility` (`prefers-reduced-motion`, focus).

## Mô tả chi tiết từng bài

### 1. Lazy + Dynamic Import
Giải quyết "bundle phình to" bằng hai nửa: **route-level lazy** (mỗi route một chunk, tải khi điều hướng) và **conditional `import()`** (tải component nặng trong event handler như mở modal/editor). `React.lazy` chỉ hiểu **default export** — với named export phải map `import('./X').then(m => ({ default: m.X }))`. Bắt buộc bọc `<Suspense>` (nếu không React báo lỗi runtime) và nên thêm `ErrorBoundary` + nút "Thử lại" cho trường hợp mạng lỗi khi tải chunk.

### 2. PWA Offline
Dùng `vite-plugin-pwa` (bọc Workbox) để sinh service worker + manifest tự động. Ba chiến lược cache quan trọng: `CacheFirst` (asset tĩnh), `NetworkFirst` (API — luôn ưu tiên mới, rơi cache khi offline), `StaleWhileRevalidate` (hiện ngay + cập nhật nền). Chọn sai chiến lược là lỗi phổ biến nhất. Badge online/offline đọc `navigator.onLine` qua `useSyncExternalStore` để concurrent-safe.

### 3. Two-state Split (Zustand + TanStack Query)
Chốt lại nguyên tắc: **server state để TanStack Query lo, client state để Zustand lo**. Query quản `queryKey`/`staleTime`/`invalidateQueries`/optimistic update; Zustand quản state thuộc phiên UI (sidebar, modal, cart nháp) với selector (`useShallow`) để tránh re-render thừa. Tuyệt đối không copy server data vào store — đó là nguồn desync.

### 4. Web Worker
Đẩy tác vụ > ~16ms ra thread riêng để main thread (nơi React render) không bị block. Giao tiếp qua `postMessage` (structured clone) và transferable object (`ArrayBuffer`, `OffscreenCanvas`) để tránh copy dữ liệu lớn. Worker **không có DOM** — chỉ tính toán rồi gửi kết quả về. Comlink giảm boilerplate; luôn `worker.terminate()` trong cleanup để tránh leak.

### 5. Routing Animation + Guard
Kết hợp bảo vệ route và trải nghiệm chuyển cảnh: guard ở `loader` (React Router v7) chạy **trước khi render** nên không flash nội dung; guard component (`RequireAuth`/`RequireRole` + `<Navigate replace>`) nhanh nhưng vẫn vẽ 1 khung. Animation dùng `AnimatePresence mode="wait"` + `motion.div key={pathname}`, giữ 0.18–0.3s và tôn trọng `prefers-reduced-motion`.

### 6. Redux Toolkit (mini-track)
Track 5 bài theo khái niệm: `1-slice-store` (slice + store + typed hooks, Immer) → `2-async-thunk` (pending/fulfilled/rejected, mẫu status/error, signal hủy) → `3-entity-adapter` (chuẩn hóa collection, selector memo) → `4-rtk-query` (fetch hợp nhất bằng tags, quyết chọn với TanStack) → `5-devtools-persist` (time-travel, listener middleware, persist whitelist/migrate). Dành cho app lớn/nhiều team cần tính kiểm chứng: mọi thay đổi qua action có tên, DevTools time-travel + diff payload.

### 7. Zustand (mini-track)
Track 4 bài đào sâu nửa Zustand của bài 3: `1-create-selectors` (create curried, selector + `Object.is`, `useShallow`, đọc ngoài React) → `2-async-actions` (fetch + cờ loading/error, optimistic tay + rollback) → `3-middleware-persist` (persist + partialize/migrate, devtools, immer, thứ tự bọc) → `4-slices-pattern` (tách domain nhiều file, một store, giao tiếp qua `get()`).

## Sai lầm thường gặp (tổng hợp)

- **Quên `<Suspense>` quanh component lazy** → lỗi runtime "A component suspended while responding to synchronous input" — luôn đặt fallback (bài 1).
- **Cache-first cho API** trong PWA → user thấy dữ liệu cũ mãi; API phải dùng `NetworkFirst`/`StaleWhileRevalidate` (bài 2).
- **Copy server data vào Zustand** → desync, re-render dư; server state để nguyên trong Query (bài 3).
- **Quên `worker.terminate()`** → worker chồng chất, leak thread (bài 4).
- **Guard quyền bằng `localStorage` rồi coi là bảo mật** → ai cũng sửa được; đây chỉ là guard UX (bài 5).
- **Nhét cả server cache vào Redux** → tự viết lại stale/retry mà Query đã có; Redux giữ client state + kết quả đã xử lý (bài 6).
- **`AnimatePresence mode="wait"` để exit quá lâu** (>0.4s) → điều hướng cảm giác "đơ" (bài 5).

## Câu hỏi thường gặp

- **Khi nào nên lazy hoá?** Khi bundle đầu > 150–200KB gzip, hoặc có module nặng chỉ dùng ở vài màn hình.
- **PWA có cần cho mọi app?** Không — hợp với app dùng lại nhiều, mạng kém; không hợp dashboard realtime luôn phải mới.
- **App nhỏ có cần TanStack Query không?** App chủ yếu form client-side chưa có API thì Query là lớp thừa, nhưng Zustand vẫn hữu ích.
- **Web Worker thay được Service Worker không?** Không — khác nhiệm vụ: Worker tính toán cho tab đang mở, Service Worker proxy mạng/cache kể cả khi tab đóng.
- **Guard ở loader hay component?** Dùng cả hai: loader chặn trước render, component redirect nhanh theo state client.
- **Khi nào Redux thay vì Zustand?** App lớn/nhiều team cần time-travel, audit action, undo — còn app vừa thì bài 3 đủ.
- **Học Zustand sâu ở đâu?** Bài 7 (4 bài: selector → async → middleware → slices); bài 3 vẫn là tổng quan split.

## Điểm chung

- Tất cả demo đi kèm `example.tsx` trong mỗi thư mục con, comment tiếng Việt từng dòng.
- Kiến thức nền 2026: React 19.3, Vite 7, TanStack Query v5, Zustand v5, React Router v7, Motion.
