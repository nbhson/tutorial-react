# single-spa

> Nguồn: https://single-spa.js.org/

## Mục tiêu

### 1. Hiểu mô hình orchestrator: nhiều micro-app khác framework sống chung một trang

**Vì sao:** Module Federation chia sẻ module lúc runtime (mạnh khi cùng React). single-spa là **runtime orchestrator**: đăng ký nhiều application, mỗi app mount/unmount khi route khớp — mạnh ở trộn framework (React 19 ở `/shop`, Angular/Vue ở `/admin` cùng trang), migration dần (strangler), team release riêng. Root config là app "mẹ" nhỏ chỉ đăng ký + `start()`; mỗi micro-app là bundle riêng nạp lười theo route.

**Cơ chế:** `registerApplication(name, loader, activeWhen)` khai báo; `start()` bắt đầu điều phối. Route đổi → so `activeWhen` → chưa tải thì `loadApp()` → `bootstrap()` 1 lần → `mount(props)` vào slot → rời đi thì `unmount()` dọn. Quay lại thì `mount()` lại (không bootstrap lại).

### 2. Cấu hình lifecycle `bootstrap/mount/unmount` cho app React (`single-spa-react`)

**Vì sao:** orchestrator không biết React — nó chỉ gọi 3 hàm chuẩn. `single-spa-react` bọc component thành 3 hàm này (quản `createRoot`, `root.unmount()` tự động, `errorBoundary` để một app chết không kéo cả trang). Không qua nó mà tự viết lifecycle dễ sót unmount (leak) và xử lý root sai.

### 3. Điều phối theo route (`activeWhen`) và ghép layout dùng chung bằng `single-spa-layout`

`activeWhen` là string prefix (`'/shop'`), hàm (`loc => loc.pathname.startsWith('/admin')`), hoặc mảng. `single-spa-layout` đọc `<template>` có slot `<div id="single-spa-application:shop">` để chèn app đúng chỗ + giữ layout tĩnh (topbar) xuyên app. Truyền dữ liệu liên app qua custom props/event bus/shared store — không import trực tiếp app khác (phá deploy độc lập).

## Tổng quan

- single-spa là **runtime orchestrator**: đăng ký nhiều application, mỗi app tự mount/unmount khi route khớp. Một trang có thể chứa React + Angular + Vue cùng lúc, mỗi vùng một framework.
- Khác Module Federation (chia sẻ module lúc runtime, mạnh cùng stack), single-spa mạnh ở **trộn framework**, tích hợp dần, chia theo domain với chính sách release riêng.
- Áp dụng khi team dùng framework khác nhau, migration dần, hoặc domain cần deploy riêng. Một app React duy nhất thì không cần — thêm orchestrator vô ích.
- Root config nhỏ (router + orchestration, không nghiệp vụ); mỗi micro-app bundle riêng nạp lười; import map trỏ URL từng app; custom props truyền ngữ cảnh (username, api base).

## Khái niệm cốt lõi

### 1. Lifecycle — `bootstrap` 1 lần, `mount`/`unmount` nhiều lần

`bootstrap` khởi tạo chung (chạy 1 lần đầu). `mount(props)` render vào slot (mỗi lần vào route). `unmount(props)` dọn DOM + listener + interval (mỗi lần rời). Quên dọn trong unmount là leak chéo app (interval app cũ vẫn chạy khi đã sang app mới). `singleSpaReact` lo `root.unmount()` sẵn, nhưng interval/listener tự tạo trong app vẫn phải dọn.

```tsx
// Vòng đời chuẩn (nhớ thứ tự):
// vào lần đầu: loadApp → bootstrap → mount
// rời đi: unmount (dọn!)
// quay lại: mount (KHÔNG bootstrap lại)
```

### 2. `registerApplication` — name + loader + activeWhen

```ts
// ✅ ĐÚNG: khai rõ 3 thứ — tên, cách tải, khi nào sống
import { registerApplication } from 'single-spa';
registerApplication('shop', () => import('shop'), (loc) => loc.pathname.startsWith('/shop'));
```

**Sai thì sao:** `activeWhen` prefix chồng (`/shop` và `/shop-admin` cùng khớp) → hai app cùng mount đè nhau. Fix: mảng có thứ tự + predicate chính xác, test cả route biên.

### 3. `start()` — gọi sau khi đăng ký + layout sẵn sàng

Gọi sớm (layout chưa có slot) → app mount vào không khí, lỗi im. Quên gọi → không app nào mount. Luôn là dòng cuối sau `registerApplication` hàng loạt.

### 4. `single-spa-react` — bọc component thành lifecycle chuẩn

```tsx
// ✅ ĐÚNG: để lib lo root + unmount + errorBoundary
const lifecycles = singleSpaReact({ React, ReactDOMClient: { createRoot }, rootComponent: ShopApp });
export const { bootstrap, mount, unmount } = lifecycles;
```

### 5. Parcel — component xuyên app không cần route

Header/modal dùng ở nhiều app mà không muốn đăng ký route riêng → Parcel (mount tay ở bất kỳ slot nào). Khác application (route-driven), Parcel là component-driven.

### 6. `single-spa-layout` — template slot theo route

```html
<!-- slot tên app: orchestrator chèn app đúng chỗ, giữ topbar tĩnh -->
<template id="single-spa-template">
  <div id="topbar"></div>
  <div id="single-spa-application:shop"></div>
  <div id="single-spa-application:admin"></div>
</template>
```

### 7. Truyền dữ liệu liên app — custom props/event bus, không import trực tiếp

`import Shop from 'shop'` ở admin tạo bundle chéo, deploy dính nhau (sửa shop phải build lại admin). Đúng: custom props (`{ username }`), `window.dispatchEvent` event bus, hoặc shared store singleton. Ba cách đều giữ deploy độc lập.

## Luồng hoạt động / Cách áp dụng

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

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), cộng root-config và template:

```tsx
// shop-app.tsx — mirror đầy đủ, khớp từng dòng với example.tsx
// Biến component React thành lifecycle single-spa để orchestrator gọi được
import React from 'react';
import { createRoot } from 'react-dom/client';
import singleSpaReact from 'single-spa-react';

// rootComponent + customProps do orchestrator truyền vào (username từ root-config)
// Vì sao customProps: app không import app khác — mọi ngữ cảnh chung đi qua props này
function ShopApp(props: { customProps?: { username?: string } }) {
  return <h1>Shop — chào {props.customProps?.username ?? 'khách'}</h1>;
}

// Bọc React component thành 3 lifecycle chuẩn (bootstrap/mount/unmount)
// Vì sao qua lib: tự quản createRoot/unmount/errorBoundary dễ sót — lib lo sẵn, unmount sạch
const lifecycles = singleSpaReact({
  React, // lib cần React để tạo element
  ReactDOMClient: { createRoot }, // React 19 dùng createRoot, không ReactDOM.render cũ
  rootComponent: ShopApp, // component gốc của micro-app này
});

// Orchestrator chỉ gọi 3 hàm này — không biết gì về UI bên trong
export const { bootstrap, mount, unmount } = lifecycles;
```

```ts
// root-config.ts — orchestrator: chỉ điều phối, không biết chi tiết UI
import { registerApplication, start } from 'single-spa';
import { constructRoutes, constructApplications, constructLayoutEngine } from 'single-spa-layout';

// Layout với slot cho từng app (template lấy từ index.html)
// Vì sao từ template: slot khai báo một nơi, thêm app mới chỉ thêm slot + bundle, không sửa code điều phối
const routes = constructRoutes(document.querySelector('#single-spa-template')!);
const apps = constructApplications({
  routes,
  loadApp: ({ name }) => import(/* @vite-ignore */ name), // nạp bundle qua import map đã khai (@vite-ignore để Vite không bundle lúc build root)
});
const layoutEngine = constructLayoutEngine({ routes, apps }); // chèn app vào slot theo route

apps.forEach((app) => registerApplication(app)); // đăng ký hàng loạt từ template — không liệt kê tay từng app

// Sau khi đã đăng ký xong mới cho phép app mount — gọi sớm là mount vào slot chưa có
start();
```

```html
<!-- index.html — layout engine: slot "shop" thay bằng app shop khi route khớp -->
<template id="single-spa-template">
  <div id="topbar"></div>
  <div id="single-spa-application:shop"></div>
  <div id="single-spa-application:admin"></div>
</template>
```

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

```ts
// ❌ SAI: start trước khi đăng ký/layout xong
start(); apps.forEach(registerApplication);
// ✅ ĐÚNG: đăng ký + layout xong mới start (như root-config trên)
```

### 2. `activeWhen` sai → hai app cùng khớp hoặc không ai khớp

Dùng predicate tường minh + test route biên (`/shop` vs `/shop-admin`). Mảng có thứ tự khi nhiều app gần prefix.

### 3. Import trực tiếp app khác → dính deploy, vòng bundle

Dùng custom props/event bus/shared store. Muốn UI chung thì Parcel hoặc design-system package riêng, không import app.

### 4. Unmount không sạch → leak chéo app

Interval/listener/subscription tự tạo phải dọn trong unmount (lib chỉ dọn root React). App cũ setState sau unmount là warning + leak.

### 5. Import map sai URL/CORS → 404

Xác nhận map trỏ đúng bundle, `%PUBLIC_URL%` đúng môi trường, CDN trả CORS cho JS cross-origin.

## Best practices / Mẹo

### Root-config cực nhỏ; auth/data qua props; dev standalone; Parcel cho chung; đo mount

Root không nghiệp vụ — chỉ router + orchestration. Custom props/context chung cho auth, không DOM global. Mỗi app chạy riêng ở dev để nhanh. Topbar/modal chung dùng Parcel thay vì application. User Timing đo mount để bắt app chậm (mount > 500ms là mùi bundle to/chưa lazy trong app).

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
