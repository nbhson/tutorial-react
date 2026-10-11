# Share Deps, Routing + Deploy Độc Lập

> Nguồn: https://micro-frontends.org/ — https://module-federation.io/guide/basic/

## Mục tiêu
- Chốt được "3 trụ" để micro-frontend bền: dependency dùng chung 1 bản, routing không đá nhau, deploy độc lập theo version.
- Cấu hình `shared` với `singleton + requiredVersion` đúng cách và biết khi nào chấp nhận 2 bản.
- Phối hợp routing host/remote bằng `basename`/memory router và version hóa `remoteEntry.js`.

## Tổng quan
- Micro-frontend thất bại khi: 2 bản React crash, hai app fighting về URL, hoặc deploy chung dính lẫn nhau.
- Bài này là "điều kiện để MF sống khỏe" sau khi đã làm `1-module-federation` (cơ chế) — tập trung vào version/dependency, routing, contract.
- Áp dụng từ khi hệ thống có ≥ 2 remotes thật dùng chung design-system/router; không cần nếu chỉ 1 app.

## Khái niệm cốt lõi
- **Singleton + requiredVersion**: `shared: { react: { singleton: true, requiredVersion: '^19.0.0' } }` — các bên chọn **một** bản React duy nhất. Nếu không khớp version, MF sinh 2 bản → invalid hook call.
- **Lệch major có chủ đích**: một số thư viện (zustand v4 vs v5) cho phép 2 bản trong thời gian migration; phải **tuyên bố rõ** bằng `singleton: false` hoặc khác `eager`, không để ngầm.
- **Routing**: chỉ host giữ `BrowserRouter` (bảo URL thật). Remote dùng `createMemoryRouter` + nhận `basePath`, hoặc dùng `basename` của BrowserRouter riêng nhưng đồng bộ qua custom event.
- **Versioned deploy**: mỗi remote publish `remoteEntry.js` theo `version` (`/shop/1.2.0/remoteEntry.js`); host production **pin version**, preview chỉ `latest`. Ngắt mạnh: `iframe` fallback hoặc redirect trang lỗi.
- **Contract test**: host-remote trao đổi qua props — ký hợp đồng kiểu dữ liệu (TS types shared / Pact contract) chạy ở CI mỗi bên để lệch sớm phát hiện, không đợi runtime.

## Luồng hoạt động / Cách áp dụng
1. Tạo file `shared-deps.ts` dùng chung host + remotes (tránh lệch config).
2. Host giữ `BrowserRouter`; truyền `basePath` vào remote qua customProps.
3. Remote tạo `createMemoryRouter` với `initialEntries: [basePath]`; không tự tạo BrowserRouter.
4. Khi remote đổi path (nav nội bộ), bắn custom event để host cập nhật URL.
5. Publish remote theo tag version; host production pin version, preview `latest`.
6. Chạy contract test + `tsc --noEmit` chéo ở CI mỗi bên.

## Ví dụ chi tiết
```ts
// shared-deps.ts — import vào config cả host + remotes (nguồn sự thật duy nhất)
export const sharedDeps = {
  // Một bản React duy nhất trong toàn hệ thống
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  zustand: { singleton: true }, // state dùng chung nên phải 1 bản
} as const;

// Host production PIN version để remote không đổi lung tung khi release
export const remoteUrls = {
  production: 'https://cdn.example.com/shop/1.2.0/remoteEntry.js',
  preview: 'https://cdn.example.com/shop/latest/remoteEntry.js',
} as const;
```

```tsx
// remote/CartApp.tsx — nhận basePath từ host, dùng memory router
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

const routes = [
  { path: '/', element: <CartList /> },
  { path: '/checkout', element: <Checkout /> },
];

export function RemoteApp({ basePath }: { basePath: string }) {
  // MemoryRouter: giữ lịch sử "ảo" trong JS, không đụng URL trình duyệt
  const router = createMemoryRouter(routes, { initialEntries: [basePath] });
  return <RouterProvider router={router} />;
}
```

```ts
// host/RouteSync.tsx — lắng nghe remote đổi path để đồng bộ URL (custom event)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useRemotePathSync(appName: string) {
  const navigate = useNavigate();
  useEffect(() => {
    // Remote bắn 'remote:nav' khi tự điều hướng nội bộ
    const onNav = (e: Event) => {
      const { path } = (e as CustomEvent).detail;
      navigate(path); // host cập nhật URL + có thể deep-link
    };
    window.addEventListener(`remote:nav:${appName}`, onNav);
    return () => window.removeEventListener(`remote:nav:${appName}`, onNav);
  }, [navigate, appName]);
}
```

## Giải thích từng phần
- `sharedDeps` dùng chung: một nơi khai báo → host + remote không lệch config.
- `createMemoryRouter`: remote có router riêng nhưng không chiếm URL → tránh tranh chấp với host.
- `initialEntries: [basePath]`: remote biết mình đang ở "thư mục" nào trong URL host.
- Custom event `remote:nav`: biến điều hướng nội bộ của remote thành thay đổi URL host (deep-link được).
- `remoteUrls.production` pin version: đổi remote phải chủ động nâng version + host nhận bản mới.

### Ma trận quyết định `singleton`
| Tình huống | `singleton` | Lý do |
|---|---|---|
| `react`, `react-dom` | `true` (bắt buộc) | 2 bản → invalid hook call |
| Design system / theme | `true` | Đảm bảo UI nhất quán |
| `zustand`/state dùng chung | `true` | Một nguồn state duy nhất |
| Thư viện đang migration major | `false` tạm thời | Chấp nhận 2 bản có chủ đích, có kế hoạch gộp |
| Thư viện nặng chỉ 1 app dùng | `false` | Không cần share, remote tự mang |

## Lỗi thường gặp / Chống chỉ định
- **Remote tự tạo `BrowserRouter`**: đè URL host, refresh mất route → remote dùng memory router + `basePath`.
- **`shared` lệch giữa host và remote**: MF giữ 2 bản vô tình → dùng chung file `sharedDeps`.
- **Chảy deploy remote mà không pin version**: remote đổi gãy host lúc nửa đêm → production pin version, dùng `latest` chỉ ở preview.
- **Không đồng bộ URL khi remote đổi path**: user không back/refresh được giữa remote-host → bắn custom event `remote:nav`.
- **Không có contract test**: remote đổi props type làm host crash runtime mới thấy → publish types chung + CI check.

## Best practices / Mẹo
- Rule ngón tay cái: remote **không** bao giờ `import('react')` bản riêng — luôn qua shared.
- Thiết lập "composition contract" (khung JSON: name, version, exposes, shared) để CI host tự kiểm tra khả dụng remote.
- Version theo semantic; giữ ít nhất 2 bản gần nhất trên CDN để rollback tức thì.
- Log version remote đang chạy (`performance` entry / custom header) để debug nhanh.
- Lên kế hoạch nâng major dùng chung: dùng `eager: false` + runtime check thay vì cố ép singleton.
- Ghi lại bảng "ai đang dùng version nào" trong repo (dependency map) để review thay đổi shared dễ hơn.
- Test tích hợp host + remote ở preview **trước** khi pin version lên production để tránh gãy đêm.

## Bài tập nhỏ
Mô phỏng: remote A chỉ `zustand` v4, remote B dùng v5, host shared singleton. Mô tả điều gì xảy ra với store khi cả hai cùng mount; đề xuất chính sách `singleton: true/false` cho từng trường hợp và rollout an toàn.

## Reference
- [micro-frontends.org](https://micro-frontends.org/)
- [Module Federation — Shared modules](https://module-federation.io/guide/basic/)
- [react-router — Memory Router](https://reactrouter.com/api/react-router/createMemoryRouter)
- [Pact — contract testing](https://docs.pact.io/)