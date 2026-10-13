# Micro-frontend — Tổng quan

> Nguồn: https://micro-frontends.org/ — https://module-federation.io/

Micro-frontend chia một ứng dụng lớn thành nhiều app nhỏ do các team khác nhau sở hữu và **deploy độc lập**. Nhóm này đi từ cơ chế (Module Federation, single-spa) tới "điều kiện sống khỏe" (share dependency, routing, version deploy).

## Nhóm này giải quyết gì

Khi một frontend phình tới mức nhiều team cùng code, các vấn đề tổ chức xuất hiện:

1. **Deploy dính nhau** — sửa một nút cũng phải build/deploy cả app → micro-frontend cho deploy độc lập.
2. **Tranh chấp code** — nhiều team sửa chung một repo, một pipeline → tách app theo team/domain.
3. **Trộn công nghệ** — cần chạy app mới (React) cạnh app cũ (Angular/Vue) → orchestration đa framework.
4. **Sống còn về vận hành** — deps lệch bản, hai app giành URL, remote deploy lệch gây trắng trang → cần quy tắc share/routing/version.

## Khi nào cần

- Nhiều team **cùng framework** muốn chia sẻ module/component và deploy độc lập → **bài 1 (Module Federation)**.
- Cần **trộn nhiều framework** trên cùng trang, hoặc migration dần từng phần (incremental) → **bài 2 (single-spa)**.
- Đã có micro-frontend và cần chuẩn hóa share deps/routing/version để không sụp → **bài 3**.
- **Chống chỉ định**: app nhỏ, một team — micro-frontend chỉ thêm phức tạp (nhiều repo, nhiều pipeline, nhiều điểm hỏng). Hãy bắt đầu monolith gọn rồi tách khi thật cần.

## Các bài con

| # | Bài | Nội dung | Trọng tâm |
|---|---|---|---|
| 1 | [1-module-federation/](1-module-federation/README.md) | Module Federation với **Vite/Rspack**: host tải remote lúc runtime, share singleton dependency, type-safe remote. So sánh `@module-federation/vite` (dev nhanh) vs Rspack (production ổn định). | Chia sẻ code |
| 2 | [2-single-spa/](2-single-spa/README.md) | **single-spa**: orchestration nhiều app khác framework trên một trang, lifecycle `mount/unmount`, layout engine. Điều phối theo route prefix, truyền dữ liệu qua custom props/event bus. | Điều phối |
| 3 | [3-shared-deps-deploy/](3-shared-deps-deploy/README.md) | Share deps, routing liên app (**basename/memory router**) + deploy độc lập theo version, contract test. Chỉ host giữ `BrowserRouter`, remote dùng memory router. | Vận hành |

## Mô tả chi tiết từng bài

### 1. Module Federation (Vite / Rspack)
Host tải component từ remote lúc runtime (`import('shop/Cart')`) — không cần build chung. Bài này giải thích `remoteEntry.js`, **share scope**, `singleton` + `requiredVersion` (tránh 2 bản React gây "invalid hook call"), trade-off giữa `@module-federation/vite` (dev nhanh) và Rspack (production ổn định), kèm fallback `ErrorBoundary` + retry khi remote deploy lệch.

### 2. single-spa
Orchestrator cho nhiều micro-app **khác framework** (React + Angular + Vue) trên cùng trang, điều phối theo route prefix (`/shop`, `/admin`). Bài này trình bày lifecycle `bootstrap/mount/unmount` qua `single-spa-react`, `registerApplication` + `start()`, `single-spa-layout` ghép header/footer, và truyền dữ liệu qua custom props/event bus thay vì import trực tiếp.

### 3. Share Deps, Routing + Deploy Độc Lập
Vì sao micro-frontend có thể sụp: deps lệch bản, hai app giành URL, hoặc deploy dính nhau. Bài này chốt 3 trụ: (1) `shared` dùng chung file config `singleton + requiredVersion`; (2) chỉ host giữ `BrowserRouter`, remote dùng `createMemoryRouter` + nhận `basePath`, đồng bộ qua custom event; (3) publish `remoteEntry.js` theo version, host production pin version, preview dùng `latest`, kèm contract test ở CI.

## Thứ tự đọc gợi ý

```
1 (Module Federation) → 2 (single-spa) → 3 (share deps/routing/deploy)
```

- **1**: hiểu cơ chế chia sẻ module ở runtime — trục "cùng framework".
- **2**: mở rộng sang orchestration đa framework — trục "điều phối".
- **3**: chốt các quy tắc vận hành để hệ thống "sống khỏe" — trục "production".

Nếu chỉ chọn một hướng: cùng framework → đi thẳng 1 → 3; trộn framework → 2 → 3.

## Liên quan tới bài nào khác

- **Bài 1 (MF)** cần code-splitting/vendor (`3_performance-optimization/3-code-splitting`) và Error Boundary (`8_best-practices/3-error-boundary`) làm fallback khi remote lỗi.
- **Bài 2 (single-spa)** dựa trên kiến thức routing ở `1_advanced-features/5-routing-animation-guard`.
- **Bài 3 (routing/deploy)** liên hệ auth cookie/BFF (`4_security-config/4-auth-httpOnly-cookie`) — remote cần biết "đang đăng nhập chưa" mà không truyền token sai cách.
- **Cả nhóm** liên quan `2_architecture-patterns/1-feature-sliced-bulletproof` (ranh giới module khi tách app) và `6_dev-tools/1-vite` (cấu hình build).

## Sai lầm thường gặp (tổng hợp)

- **Share React không đúng `singleton`** → 2 bản React chạy song song gây "invalid hook call"; luôn `singleton` + `requiredVersion` (bài 1).
- **Remote deploy lệch version** → UI trắng/crash; host production pin version, thêm `ErrorBoundary` + retry (bài 1, 3).
- **Nhiều app cùng tranh `BrowserRouter`** → URL lệch, back/forward hỗn loạn; chỉ host giữ browser router, remote dùng memory router (bài 3).
- **Import trực tiếp giữa các app** → coupling chặt, build dính nhau; giao tiếp qua props/event bus (bài 2).
- **Không có contract test** → remote đổi API ngầm làm host vỡ; kiểm tra hợp đồng ở CI (bài 3).
- **Chia micro-frontend cho app một-team nhỏ** → over-engineering, nhiều điểm hỏng.

## Câu hỏi thường gặp

- **Module Federation khác single-spa thế nào?** MF chia sẻ module runtime (cùng framework); single-spa orchestrate nhiều app/framework (đa framework).
- **Có thể kết hợp cả hai không?** Có — single-spa orchestrate, mỗi app dùng MF để share design-system.
- **Có bắt buộc cùng framework không?** MF thường cùng React; single-spa cho phép trộn React/Angular/Vue.
- **Làm sao để 2 bản React không xung đột?** `shared` singleton với `requiredVersion` phù hợp.
- **Khi nào KHÔNG nên dùng micro-frontend?** App nhỏ, một team, hoặc chưa có nhu cầu deploy độc lập.

## Lựa chọn giữa hai hướng

- **Module Federation**: các team cùng framework, chia sẻ module/component; nhẹ, tích hợp sâu.
- **single-spa**: trộn nhiều framework, cần incremental migration; mạnh về orchestration nhưng "xuyên" hơn.
- Có thể kết hợp: single-spa orchestrate các app, mỗi app dùng MF để share design-system.

## Tham khảo

- [micro-frontends.org](https://micro-frontends.org/)
- [Module Federation docs](https://module-federation.io/)
- [single-spa](https://single-spa.js.org/)
