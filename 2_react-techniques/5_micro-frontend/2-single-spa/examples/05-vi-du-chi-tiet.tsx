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
