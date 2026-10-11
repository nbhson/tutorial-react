# Module Federation (Vite / Rspack)

> Nguồn: https://module-federation.io/ — https://github.com/module-federation/vite

## Mục tiêu
- Hiểu mô hình host/remote và cách Module Federation "share" dependency lúc runtime.
- Cấu hình được remote expose component + host import lười (lazy) an toàn.
- Biết chọn Vite plugin hay Rspack khi build production, kèm fallback khi remote lỗi.

## Tổng quan
- Module Federation (MF) cho phép host tải code từ remote ngay **lúc runtime**: `import('shop/Cart')` sẽ fetch `remoteEntry.js` về và lấy module.
- Mỗi team (remote) **deploy độc lập** — không cần phát hành chung cả monolith; host chỉ cần biết URL remoteEntry.
- Với Vite: dùng `@module-federation/vite` (dev chạy tốt); build production ổn định nhất ở Rspack (`@module-federation/rspack`) — MF được ưu tiên hỗ trợ trên Rspack.
- Áp dụng khi team phân chia theo domain (shop, admin, payment) đều viết React và muốn tách release.

## Khái niệm cốt lõi
- **Host vs Remote**: host (container) là app chính giữ layout/routing; remote expose module (`exposes: { './Cart': './src/Cart.tsx' }`).
- **`remoteEntry.js`**: file nhỏ chứa "bản đồ" module của remote; host tải nó trước rồi mới lazy-load module bên trong.
- **Share scope & singleton**: `shared: { react: {...} }` nói hai bên dùng chung một bản React. Nếu **2 bản React** cùng mount, hooks vỡ (invalid hook call). `singleton: true` + `requiredVersion` để hai bên "đàm phán" chọn một bản version phù hợp.
- **Version negotiation**: khi version không khớp, MF giữ bản ở đúng range qua `requiredVersion`; lệch major quá nặng thì mỗi bên dùng bản của mình (double-React → nguy hiểm).
- **`eager: true`**: module dùng ngay ở entry (không chunk riêng), cần cho async boundary.
- **Type-safe remote**: dùng `@module-federation/typescript` (hay `federation-types`) download `.d.ts` lúc dev để `import('shop/Cart')` có type.
- **Runtime fallback**: remote có thể deploy lệch/crash → host bọc `ErrorBoundary` + nút retry.

## Luồng hoạt động / Cách áp dụng
1. Remote (team shop): cấu hình `name`, `filename: 'remoteEntry.js'`, `exposes`, `shared`.
2. Remote build → tải `remoteEntry.js` lên CDN versioned (`/shop/1.2.0/remoteEntry.js`).
3. Host: khai báo `remotes` trỏ URL remote, thêm `shared` giống hệt remote.
4. Host: `lazy(() => import('shop/Cart'))` bọc `Suspense` + `ErrorBoundary`.
5. Lúc dev dùng `@module-federation/vite`; production chuyển Rspack cho loader ổn định.
6. Test tích hợp: host chạy với remote bản `latest` ở môi trường preview (xem bài `3-shared-deps-deploy`).

## Ví dụ chi tiết
```ts
// remote/vite.config.ts — team shop, build bằng Rspack cho production
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/rspack';

export default {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shop',                    // tên scope của remote này
      filename: 'remoteEntry.js',      // bản đồ module, host tải trước
      exposes: { './Cart': './src/Cart.tsx' }, // module công khai ra ngoài
      shared: {                        // các dep dùng chung với host
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
  ],
};
```

```ts
// Vite-only variant (dev nhanh) — đổi plugin đúng dòng
import federation from '@module-federation/vite';
export default {
  plugins: [
    federation({
      name: 'shop',
      filename: 'remoteEntry.js',
      exposes: { './Cart': './src/Cart.tsx' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
};
```

```tsx
// host/src/HostCart.tsx — tải remote lúc runtime + fallback đầy đủ
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// import('shop/Cart') chỉ fetch remoteEntry khi component này render
// @ts-expect-error — type đến từ federation-types khi dev
const RemoteCart = lazy(() => import('shop/Cart'));

export function HostCart() {
  return (
    // Remote lỗi render → không vỡ cả trang, cho phép thử lại
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div role="alert">
          <p>Không tải được giỏ hàng (remote lỗi).</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
    >
      {/* Suspense: hiện fallback trong lúc fetch remoteEntry + module */}
      <Suspense fallback={<p>Đang tải giỏ hàng…</p>}>
        <RemoteCart />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Giải thích từng phần
- `name: 'shop'`: namespace module — host viết `import('shop/Cart')` khớp với `name` + key trong `exposes`.
- `filename: 'remoteEntry.js'`: URL này host nạp để biết module remote.
- `shared.singleton`: chỉ một bản React tồn tại — tránh "invalid hook call".
- `requiredVersion: '^19.0.0'`: hai bên đối chiếu version; nếu host đang 19.x thì dùng chung, không nạp thêm.
- `ErrorBoundary` + `resetErrorBoundary`: cách ly lỗi của remote và tải lại khi remote mới deploy.

## Lỗi thường gặp / Chống chỉ định
- **Hai bản React** (không `shared` hoặc lệch major) → "Invalid hook call" → chia sẻ đúng `singleton + requiredVersion`.
- **Quên `exposes` trên remote**: host import báo không tìm thấy → đối chiếu `name` + key.
- **`remoteEntry.js` nằm sau auth/CDN chặn**: browser bắt CORS/404 lúc runtime → mở CDN cho remoteEntry, dùng HTTPS.
- **Load remote non-lazy ở entry**: đẩy thời gian khởi động cả trang; lệch deploy làm trang không mở được → luôn lazy + boundary.
- **Dev Vite vs Rspack bất đồng config**: module-federation dev bằng Vite plugin có giới hạn loader → đồng bộ config, test production bằng Rspack.

## Best practices / Mẹo
- Chia sẻ tối thiểu cần thiết (react, react-dom, design-system); phần còn lại để mỗi remote tự mang.
- Version hóa URL remoteEntry (`/shop/1.2.0/`) ở production (bài 3).
- Sinh type remote (`federation-types`) trong CI để dev có autocomplete.
- Theo dõi healthcheck remote; có UI "remote đang bảo trì".
- Giữ `shared` config trong một file dùng chung cả host + remotes.

## Bài tập nhỏ
Tạo remote `cart` expose `./MiniCart` (component đếm sản phẩm, dùng `useState`), host import lazy có Suspense. Cố tình bỏ `react` khỏi `shared` rồi ghi lại lỗi xảy ra; sửa lại và giải thích vì sao singleton quan trọng.

## Reference
- [Module Federation docs](https://module-federation.io/)
- [Vite plugin (@module-federation/vite)](https://github.com/module-federation/vite)
- [Rspack Module Federation](https://module-federation.io/guide/basic/)
- [TypeScript + MF](https://github.com/module-federation/typescript)