# single-spa

> Nguồn: https://single-spa.js.org/

## Mục tiêu

### 1. Hiểu mô hình orchestrator: nhiều micro-app khác framework sống chung một trang

**Vì sao:** Module Federation chia sẻ module lúc runtime (mạnh khi cùng React). single-spa là **runtime orchestrator**: đăng ký nhiều application, mỗi app mount/unmount khi route khớp — mạnh ở trộn framework (React 19 ở `/shop`, Angular/Vue ở `/admin` cùng trang), migration dần (strangler), team release riêng. Root config là app "mẹ" nhỏ chỉ đăng ký + `start()`; mỗi micro-app là bundle riêng nạp lười theo route.

**Cơ chế:** `registerApplication(name, loader, activeWhen)` khai báo; `start()` bắt đầu điều phối. Route đổi → so `activeWhen` → chưa tải thì `loadApp()` → `bootstrap()` 1 lần → `mount(props)` vào slot → rời đi thì `unmount()` dọn. Quay lại thì `mount()` lại (không bootstrap lại). Ví von: single-spa như tổng quản lý tòa nhà tổ hợp — ai đến đúng giờ mở cửa khu nào, ai rời thì dọn khu đó, còn sảnh chính (layout) thì luôn mở.

### 2. Cấu hình lifecycle `bootstrap/mount/unmount` cho app React (`single-spa-react`)

**Vì sao:** orchestrator không biết React — nó chỉ gọi 3 hàm chuẩn. `single-spa-react` bọc component thành 3 hàm này (quản `createRoot`, `root.unmount()` tự động, `errorBoundary` để một app chết không kéo cả trang). Không qua nó mà tự viết lifecycle dễ sót unmount (leak) và xử lý root sai.

### 3. Điều phối theo route (`activeWhen`) và ghép layout dùng chung bằng `single-spa-layout`

`activeWhen` là string prefix (`'/shop'`), hàm (`loc => loc.pathname.startsWith('/admin')`), hoặc mảng. `single-spa-layout` đọc `<template>` có slot `<div id="single-spa-application:shop">` để chèn app đúng chỗ + giữ layout tĩnh (topbar) xuyên app. Truyền dữ liệu liên app qua custom props/event bus/shared store — không import trực tiếp app khác (phá deploy độc lập).

> **Tóm gọn 1 câu:** Mục tiêu của bài: hiểu orchestrator điều phối nhiều micro-app khác framework theo route, mỗi app tự mount/unmount sạch sẽ.

## Tổng quan

- single-spa là **runtime orchestrator**: đăng ký nhiều application, mỗi app tự mount/unmount khi route khớp. Một trang có thể chứa React + Angular + Vue cùng lúc, mỗi vùng một framework.
- Khác Module Federation (chia sẻ module lúc runtime, mạnh cùng stack), single-spa mạnh ở **trộn framework**, tích hợp dần, chia theo domain với chính sách release riêng.
- Áp dụng khi team dùng framework khác nhau, migration dần, hoặc domain cần deploy riêng. Một app React duy nhất thì không cần — thêm orchestrator vô ích.
- Root config nhỏ (router + orchestration, không nghiệp vụ); mỗi micro-app bundle riêng nạp lười; import map trỏ URL từng app; custom props truyền ngữ cảnh (username, api base).

## Khái niệm cốt lõi

Mục này lần lượt qua 7 khái niệm: lifecycle chuẩn, đăng ký app, điểm `start()`, wrapper React, Parcel, layout engine, và cách app nói chuyện với nhau. Đọc để nắm "luật chơi" của orchestrator trước khi cấu hình.

### 1. Lifecycle — `bootstrap` 1 lần, `mount`/`unmount` nhiều lần

`bootstrap` khởi tạo chung (chạy 1 lần đầu). `mount(props)` render vào slot (mỗi lần vào route). `unmount(props)` dọn DOM + listener + interval (mỗi lần rời). Quên dọn trong unmount là leak chéo app (interval app cũ vẫn chạy khi đã sang app mới). Ví von: như khách thuê phòng homestay — làm thủ tục check-in một lần (bootstrap), mỗi lần ở thì dọn phòng trước khi trả chìa (unmount); quên tắt bếp là cả tòa nhà gặp họa. `singleSpaReact` lo `root.unmount()` sẵn, nhưng interval/listener tự tạo trong app vẫn phải dọn.

> 📄 **Code ví dụ:** [`examples/01-1-lifecycle-bootstrap-1-lan-mount-unmount-nhieu.tsx`](examples/01-1-lifecycle-bootstrap-1-lan-mount-unmount-nhieu.tsx)

### 2. `registerApplication` — name + loader + activeWhen

> 📄 **Code ví dụ:** [`examples/02-2-registerapplication-name-loader-activewhen.ts`](examples/02-2-registerapplication-name-loader-activewhen.ts)

**Sai thì sao:** `activeWhen` prefix chồng (`/shop` và `/shop-admin` cùng khớp) → hai app cùng mount đè nhau. Fix: mảng có thứ tự + predicate chính xác, test cả route biên.

### 3. `start()` — gọi sau khi đăng ký + layout sẵn sàng

Gọi sớm (layout chưa có slot) → app mount vào không khí, lỗi im. Quên gọi → không app nào mount. Luôn là dòng cuối sau `registerApplication` hàng loạt.

### 4. `single-spa-react` — bọc component thành lifecycle chuẩn

> 📄 **Code ví dụ:** [`examples/03-4-single-spa-react-boc-component-thanh-lifecycle.tsx`](examples/03-4-single-spa-react-boc-component-thanh-lifecycle.tsx)

### 5. Parcel — component xuyên app không cần route

Header/modal dùng ở nhiều app mà không muốn đăng ký route riêng → Parcel (mount tay ở bất kỳ slot nào). Khác application (route-driven), Parcel là component-driven.

### 6. `single-spa-layout` — template slot theo route

> 📄 **Code ví dụ:** [`examples/04-6-single-spa-layout-template-slot-theo-route.html`](examples/04-6-single-spa-layout-template-slot-theo-route.html)

### 7. Truyền dữ liệu liên app — custom props/event bus, không import trực tiếp

`import Shop from 'shop'` ở admin tạo bundle chéo, deploy dính nhau (sửa shop phải build lại admin). Ví von: như hai cửa hàng rút chung một thùng hàng — bên kia đổi thùng là bên này sập kệ. Đúng: custom props (`{ username }`), `window.dispatchEvent` event bus, hoặc shared store singleton. Ba cách đều giữ deploy độc lập.

> **Tóm gọn 1 câu:** `bootstrap` 1 lần, `mount`/`unmount` mỗi lần vào/rời route — app nói chuyện qua props/event chứ không import trực tiếp nhau.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước dựng hệ single-spa hoàn chỉnh: root-config, lifecycle cho từng app, đăng ký, `start()`, và truyền dữ liệu.

### Bước 1. Tạo root-config với `single-spa` + `single-spa-layout`

Template `<template>` có slot mỗi route. Import map (`systemjs-importmap` hoặc native import map) trỏ URL từng app (`%PUBLIC_URL%`/CDN + CORS cho JS).

### Bước 2. Mỗi micro-app: `singleSpaReact({...})` rồi export 3 lifecycle

Dev standalone được (mỗi app chạy riêng ở dev để nhanh), build ra bundle orchestrator nạp được.

### Bước 3. `registerApplication` từng app với `activeWhen`

String prefix cho đơn giản, predicate cho phức tạp (loại trừ, nhiều prefix). Test route chồng.

### Bước 4. `start()` sau khi xong

Đảm bảo layout + đăng ký xong mới cho mount.

### Bước 5. Custom props + public path + import map

Truyền `{ username, apiBase }` qua props. Import map trỏ đúng URL (404 là kiểm tra `%PUBLIC_URL%`/CDN/CORS đầu tiên).

> **Tóm gọn 1 câu:** Root-config đăng ký + điều phối, mỗi micro-app export 3 lifecycle, `start()` gọi cuối cùng — đúng như "khai báo danh sách khách, mở cổng sau cùng".

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), cộng root-config và template:

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.ts`](examples/06-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.html`](examples/07-vi-du-chi-tiet.html)

## Giải thích từng phần

### `singleSpaReact(...)` sinh lifecycle từ `React` + `createRoot`

`mount` tạo root + render `rootComponent` với custom props; `unmount` gọi `root.unmount()` + dọn. `errorBoundary`/`handleError` bắt lỗi render micro-app — một app crash hiện fallback slot đó, không trắng cả trang.

### `constructRoutes` từ `<template>` — slot theo tên app

Đọc slot tĩnh + động, ghép topbar (luôn hiện) + app (theo route). Thêm app = thêm slot + import map, không đụng điều phối.

### `loadApp: ({ name }) => import(name)` — nạp qua import map

`name` resolve qua import map thành URL bundle. 404 → kiểm tra map + `%PUBLIC_URL%`/CDN + CORS. `@vite-ignore` để Vite không cố bundle dynamic này lúc build root-config.

### `registerApplication` hàng loạt + `start()` cuối

Đăng ký từ template thay vì tay từng app — đỡ lệch. `start()` cuối đảm bảo không mount khi layout chưa sẵn sàng.

### Vòng đời khi route khớp (nhớ như cháo):

```text
route đổi → so activeWhen
  → chưa tải: loadApp() nạp bundle
  → bootstrap() 1 lần (khởi tạo chung)
  → mount(props) render vào slot
  → rời đi: unmount(props) dọn DOM + listener + interval
  → quay lại: mount() lại (KHÔNG bootstrap lại)
```

## Lỗi thường gặp / Chống chỉ định

### 1. `start()` sớm/quên → không app nào mount

> 📄 **Code ví dụ:** [`examples/08-1-start-som-quen-khong-app-nao-mount.ts`](examples/08-1-start-som-quen-khong-app-nao-mount.ts)

### 2. `activeWhen` sai → hai app cùng khớp hoặc không ai khớp

Dùng predicate tường minh + test route biên (`/shop` vs `/shop-admin`). Mảng có thứ tự khi nhiều app gần prefix.

### 3. Import trực tiếp app khác → dính deploy, vòng bundle

Dùng custom props/event bus/shared store. Muốn UI chung thì Parcel hoặc design-system package riêng, không import app.

### 4. Unmount không sạch → leak chéo app

Interval/listener/subscription tự tạo phải dọn trong unmount (lib chỉ dọn root React). App cũ setState sau unmount là warning + leak.

### 5. Import map sai URL/CORS → 404

Xác nhận map trỏ đúng bundle, `%PUBLIC_URL%` đúng môi trường, CDN trả CORS cho JS cross-origin.

> **Tóm gọn 1 câu:** 5 lỗi thường gặp: `start()` sai thời điểm, `activeWhen` chồng lấn, import chéo app, unmount không sạch, import map sai URL — mỗi lỗi một triệu chứng riêng để nhận diện nhanh.

## Best practices / Mẹo

### Root-config cực nhỏ; auth/data qua props; dev standalone; Parcel cho chung; đo mount

Root không nghiệp vụ — chỉ router + orchestration. Custom props/context chung cho auth, không DOM global. Mỗi app chạy riêng ở dev để nhanh. Topbar/modal chung dùng Parcel thay vì application. User Timing đo mount để bắt app chậm (mount > 500ms là mùi bundle to/chưa lazy trong app).

> **Tóm gọn 1 câu:** Root-config cực nhỏ, dữ liệu qua props, UI chung qua Parcel — orchestrator chỉ làm người điều phối chứ không làm chủ nhà bán hàng.

## Bài tập nhỏ

1. Tạo app React `profile` mount ở `activeWhen: ['/profile']`, nhận customProps `{ userId }`, render `<p>Profile {userId}</p>` (qua `singleSpaReact` + export 3 lifecycle).
2. Đăng ký ở root-config, thêm slot template, `start()` cuối.
3. Thêm Parcel header chung hiện tên app đang active (dùng custom event route đổi).
4. Test: vào `/profile` thấy profile + header; sang route khác thấy unmount sạch (interval dừng); một app crash không trắng trang (errorBoundary).

## Reference

- [single-spa docs](https://single-spa.js.org/)
- [single-spa-react](https://github.com/single-spa/single-spa-react)
- [single-spa-layout](https://single-spa.js.org/docs/layout-overview/)
- [single-spa — Configuration](https://single-spa.js.org/docs/configuration/)
