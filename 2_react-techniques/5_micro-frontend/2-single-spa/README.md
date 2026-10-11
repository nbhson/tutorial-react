# single-spa

> Nguồn: https://single-spa.js.org/

## Mục tiêu
- Hiểu mô hình orchestrator: nhiều micro-app khác framework sống chung trên một trang.
- Cấu hình lifecycle `bootstrap/mount/unmount` cho app React (`single-spa-react`).
- Điều phối theo route (`activeWhen`) và ghép layout dùng chung bằng `single-spa-layout`.

## Tổng quan
- single-spa là **runtime orchestrator**: đăng ký nhiều application, mỗi app tự mount/unmount khi route khớp.
- Khác Module Federation (chia sẻ module lúc runtime), single-spa mạnh ở chỗ **trộn framework**: React 19 ở `/shop`, Angular/Vue ở `/admin` trên cùng trang.
- Áp dụng khi các team dùng framework khác nhau, cần tích hợp dần (incremental migration) hoặc chia theo domain với chính sách release riêng.
- Root config là app "mẹ" nhỏ, chỉ đăng ký + `start()`; mỗi micro-app là một bundle riêng nạp lười theo route.

## Khái niệm cốt lõi
- **Lifecycle**: mỗi app export `bootstrap`, `mount`, `unmount` — orchestrator gọi để tạo/dọn DOM, quản lý memory, tránh app chết "âm thầm".
- **`registerApplication`**: khai `name`, loader `app: () => import(...)`, và `activeWhen` (string prefix, hàm predicate, hoặc array).
- **`start()`**: mới bắt đầu điều phối; gọi muộn để chuẩn bị (config/đăng ký) trước khi app đầu tiên mount.
- **`single-spa-react`**: bọc component React thành 3 lifecycle chuẩn, quản lý root + unmount tự động.
- **Parcel**: component dùng được trong nhiều app mà không cần đăng ký route (như header để ở layout).
- **`single-spa-layout`**: khai báo layout HTML (`<template>`) có `<div id="single-spa-application:shop">` slot; orchestrator chèn app vào slot theo route.
- **Truyền dữ liệu liên app**: custom props / event bus (`window.dispatchEvent`) hoặc shared store — **không** import trực tiếp app khác.

## Luồng hoạt động / Cách áp dụng
1. Tạo root-config với `single-spa` + `single-spa-layout` (template có slots per-route).
2. Mỗi micro-app: `singleSpaReact({ React, ReactDOMClient, rootComponent, ... })` rồi `export const { bootstrap, mount, unmount }`.
3. Root-config `registerApplication` từng app với `activeWhen: ['/shop']`.
4. Gọi `start()` sau khi đăng ký xong.
5. Pass custom props (username, api base) qua `customProps` cho app biết ngữ cảnh.
6. Public path: đặt `systemjs-importmap` hoặc import map trỏ URL từng app (%PUBLIC_URL%).

## Ví dụ chi tiết
```tsx
// shop-app.tsx — biến component React thành lifecycle single-spa
import React from 'react';
import { createRoot } from 'react-dom/client';
import singleSpaReact from 'single-spa-react';

// rootComponent + customProps do orchestrator truyền vào
function ShopApp(props: { customProps?: { username?: string } }) {
  return <h1>Shop — chào {props.customProps?.username ?? 'khách'}</h1>;
}

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient: { createRoot },
  rootComponent: ShopApp, // bọc React component thành lifecycle chuẩn
});

export const { bootstrap, mount, unmount } = lifecycles;
```

```ts
// root-config.ts — orchestrator: chỉ điều phối, không biết chi tiết UI
import { registerApplication, start } from 'single-spa';
import { constructRoutes, constructApplications, constructLayoutEngine } from 'single-spa-layout';

// Layout với slot cho từng app (template lấy từ index.html)
const routes = constructRoutes(document.querySelector('#single-spa-template')!);
const apps = constructApplications({
  routes,
  loadApp: ({ name }) => import(/* @vite-ignore */ name),
});
const layoutEngine = constructLayoutEngine({ routes, apps });

apps.forEach((app) => registerApplication(app));

// Sau khi đã đăng ký xong mới cho phép app mount
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
- `singleSpaReact(...)`: sinh lifecycle dựa trên `React` + `createRoot`; unmount tự gọi `root.unmount()`.
- `constructRoutes` từ `<template>`: đọc slot theo tên app, ghép layout tĩnh (topbar) + động (app).
- `loadApp: ({ name }) => import(name)`: nạp bundle app qua import map đã khai.
- `registerApplication` sau `constructApplications`: đăng ký hàng loạt từ template, không cần liệt kê tay từng app.
- `start()` cuối cùng: đảm bảo không app nào mount khi layout chưa sẵn sàng.
- `errorBoundary`/`handleError` trong `singleSpaReact`: bắt lỗi render của micro-app — không để một app chết kéo cả trang.

### Vòng đời một app khi route khớp
```text
route đổi → single-spa so khớp activeWhen
  → app (chưa tải) gọi loadApp() nạp bundle
  → bootstrap() 1 lần (khởi tạo chung)
  → mount(props) render vào DOM slot
  → [route rời đi] → unmount(props) dọn DOM + listener
  → [route quay lại] → mount() lại (KHÔNG bootstrap lại)
```

## Lỗi thường gặp / Chống chỉ định
- **Gọi `start()` quá sớm / quên**: app không bao giờ mount → gọi sau khi đăng ký và layout sẵn sàng.
- **`activeWhen` sai prefix**: hai app cùng khớp một route hoặc không app nào khớp → dùng mảng/độ dài thứ tự, thử `activeWhen: (loc) => loc.pathname.startsWith('/admin')`.
- **Truyền dữ liệu bằng import trực tiếp app khác**: tạo vòng lặp bundle, phá vỡ "deploy độc lập" → dùng custom props/event bus.
- **Không unmount sạch (interval, listener)**: memory leak chéo app → dọn trong `unmount` (hoặc `singleSpaReact` làm sẵn với root).
- **Import map trỏ sai URL/Kiểm tra CORS**: app load 404 → xác nhận `%PUBLIC_URL%`/CDN + CORS header cho JS.

## Best practices / Mẹo
- Giữ root-config cực nhỏ, không chứa logic nghiệp vụ — nó là router + orchestration.
- Chia sẻ auth/data qua custom props hoặc context API chung, không qua DOM global.
- Mỗi app nên có cơ chế khởi động độc lập (dev standalone) để dev nhanh.
- Dùng Parcel cho component dùng chung (topbar, modal) thay vì registerApplication.
- Đo thời gian mount (User Timing) để phát hiện app chậm.

## Bài tập nhỏ
Tạo app React `profile` mount ở `activeWhen: ['/profile']`, nhận customProps `{ userId }`, render `<p>Profile {userId}</p>`. Thêm một Parcel header dùng chung hiển thị tên app đang active.

## Reference
- [single-spa docs](https://single-spa.js.org/)
- [single-spa-react](https://github.com/single-spa/single-spa-react)
- [single-spa-layout](https://single-spa.js.org/docs/layout-overview/)
- [single-spa — Configuration](https://single-spa.js.org/docs/configuration/)