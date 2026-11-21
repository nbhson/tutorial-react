# Module Federation (Vite / Rspack)

> Nguồn: https://module-federation.io/ — https://github.com/module-federation/vite

## Mục tiêu
- Hiểu mô hình host/remote và cách Module Federation "share" dependency lúc runtime.
- Cấu hình được remote expose component + host import lười (lazy) an toàn.
- Biết chọn Vite plugin hay Rspack khi build production, kèm fallback khi remote lỗi.

## Tổng quan

Mục này phác mô hình host/remote trước khi đi chi tiết: đọc để hiểu "ai chứa ai, ai cho ai mượn code" trong Module Federation.

- Module Federation (MF) cho phép host tải code từ remote ngay **lúc runtime**: `import('shop/Cart')` sẽ fetch `remoteEntry.js` về và lấy module. Ví von: host như tòa trung tâm thương mại, remote là các cửa hàng thuê mặt bằng — tòa nhà không chứa hàng của cửa hàng, chỉ trỏ chỉ dẫn "quầy giày ở cửa A".
- Mỗi team (remote) **deploy độc lập** — không cần phát hành chung cả monolith; host chỉ cần biết URL remoteEntry.
- Với Vite: dùng `@module-federation/vite` (dev chạy tốt); build production ổn định nhất ở Rspack (`@module-federation/rspack`) — MF được ưu tiên hỗ trợ trên Rspack.
- Áp dụng khi team phân chia theo domain (shop, admin, payment) đều viết React và muốn tách release.

> **Tóm gọn 1 câu:** Module Federation cho host "mượn" component của remote ngay lúc chạy — mỗi team deploy độc lập, host chỉ cần biết địa chỉ `remoteEntry.js`.

## Khái niệm cốt lõi

Mục này giải nghĩa các khái niệm sống còn của MF: host/remote, `remoteEntry.js`, share scope với singleton, đàm phán version, và fallback khi remote lỗi. Đọc để hiểu vì sao "2 bản React" là tai nạn số một của micro-frontend.

- **Host vs Remote**: host (container) là app chính giữ layout/routing; remote expose module (`exposes: { './Cart': './src/Cart.tsx' }`).
- **`remoteEntry.js`**: file nhỏ chứa "bản đồ" module của remote; host tải nó trước rồi mới lazy-load module bên trong.
- **Share scope & singleton**: `shared: { react: {...} }` nói hai bên dùng chung một bản React. Nếu **2 bản React** cùng mount, hooks vỡ (invalid hook call). `singleton: true` + `requiredVersion` để hai bên "đàm phán" chọn một bản version phù hợp.
- **Version negotiation**: khi version không khớp, MF giữ bản ở đúng range qua `requiredVersion`; lệch major quá nặng thì mỗi bên dùng bản của mình (double-React → nguy hiểm).
- **`eager: true`**: module dùng ngay ở entry (không chunk riêng), cần cho async boundary.
- **Type-safe remote**: dùng `@module-federation/typescript` (hay `federation-types`) download `.d.ts` lúc dev để `import('shop/Cart')` có type.
- **Runtime fallback**: remote có thể deploy lệch/crash → host bọc `ErrorBoundary` + nút retry.

> **Tóm gọn 1 câu:** Host trỏ tới `remoteEntry.js` của remote, hai bên share `react` qua `singleton` để chỉ một bản React tồn tại — mượn code runtime chứ không build chung.

## Luồng hoạt động / Cách áp dụng

Mục này là 6 bước dựng pipeline host + remote từ cấu hình tới test tích hợp — đi theo thứ tự để mỗi lần thêm remote đều không vỡ host.

1. Remote (team shop): cấu hình `name`, `filename: 'remoteEntry.js'`, `exposes`, `shared`.
2. Remote build → tải `remoteEntry.js` lên CDN versioned (`/shop/1.2.0/remoteEntry.js`).
3. Host: khai báo `remotes` trỏ URL remote, thêm `shared` giống hệt remote.
4. Host: `lazy(() => import('shop/Cart'))` bọc `Suspense` + `ErrorBoundary`.
5. Lúc dev dùng `@module-federation/vite`; production chuyển Rspack cho loader ổn định.
6. Test tích hợp: host chạy với remote bản `latest` ở môi trường preview (xem bài `3-shared-deps-deploy`).

> **Tóm gọn 1 câu:** Remote expose + publish `remoteEntry.js` lên CDN, host khai báo remotes + share giống hệt, import lazy kèm `ErrorBoundary` — và test tích hợp trước khi tin nhau.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.ts`](examples/01-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.ts`](examples/02-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `name: 'shop'`: namespace module — host viết `import('shop/Cart')` khớp với `name` + key trong `exposes`.
- `filename: 'remoteEntry.js'`: URL này host nạp để biết module remote.
- `shared.singleton`: chỉ một bản React tồn tại — tránh "invalid hook call".
- `requiredVersion: '^19.0.0'`: hai bên đối chiếu version; nếu host đang 19.x thì dùng chung, không nạp thêm.
- `ErrorBoundary` + `resetErrorBoundary`: cách ly lỗi của remote và tải lại khi remote mới deploy.

## Lỗi thường gặp / Chống chỉ định

Mục này là 5 cách micro-frontend "sập" phổ biến — đứng đầu là 2 bản React. Đọc để biết triệu chứng nhận diện từng lỗi và cách khắc phục.

- **Hai bản React** (không `shared` hoặc lệch major) → "Invalid hook call" → chia sẻ đúng `singleton + requiredVersion`.
- **Quên `exposes` trên remote**: host import báo không tìm thấy → đối chiếu `name` + key.
- **`remoteEntry.js` nằm sau auth/CDN chặn**: browser bắt CORS/404 lúc runtime → mở CDN cho remoteEntry, dùng HTTPS.
- **Load remote non-lazy ở entry**: đẩy thời gian khởi động cả trang; lệch deploy làm trang không mở được → luôn lazy + boundary.
- **Dev Vite vs Rspack bất đồng config**: module-federation dev bằng Vite plugin có giới hạn loader → đồng bộ config, test production bằng Rspack.

> **Tóm gọn 1 câu:** Một bản React là luật số một: `singleton` + `requiredVersion` + chung file config — và mọi import remote đều lazy kèm ErrorBoundary.

## Best practices / Mẹo
- Chia sẻ tối thiểu cần thiết (react, react-dom, design-system); phần còn lại để mỗi remote tự mang.
- Version hóa URL remoteEntry (`/shop/1.2.0/`) ở production (bài 3).
- Sinh type remote (`federation-types`) trong CI để dev có autocomplete.
- Theo dõi healthcheck remote; có UI "remote đang bảo trì".
- Giữ `shared` config trong một file dùng chung cả host + remotes.

> **Tóm gọn 1 câu:** Chia sẻ tối thiểu, version hóa URL, type sinh tự động, healthcheck cho remote — như quản lý các cửa hàng thuê: hợp đồng rõ ràng, địa chỉ cố định, và luôn có bảng "đang bảo trì".

## Bài tập nhỏ
Tạo remote `cart` expose `./MiniCart` (component đếm sản phẩm, dùng `useState`), host import lazy có Suspense. Cố tình bỏ `react` khỏi `shared` rồi ghi lại lỗi xảy ra; sửa lại và giải thích vì sao singleton quan trọng.

## Reference
- [Module Federation docs](https://module-federation.io/)
- [Vite plugin (@module-federation/vite)](https://github.com/module-federation/vite)
- [Rspack Module Federation](https://module-federation.io/guide/basic/)
- [TypeScript + MF](https://github.com/module-federation/typescript)