# Share Deps, Routing + Deploy Độc Lập

> Nguồn: https://micro-frontends.org/ — https://module-federation.io/guide/basic/

## Mục tiêu

### 1. Chốt "3 trụ" để micro-frontend bền: dependency một bản, routing không đá nhau, deploy độc lập theo version

**Vì sao:** MF chết vì 3 lý do lặp lại: (1) 2 bản React → `Invalid hook call`, design-system lệch, store đôi; (2) host + remote cùng giữ `BrowserRouter` → tranh URL, refresh mất route, Back vỡ; (3) deploy chung/dính `latest` → remote đổi gãy host lúc nửa đêm, không rollback được. Bài này là điều kiện sống còn sau khi biết cơ chế Federation (bài 1) — không chốt 3 trụ thì càng thêm remote càng vỡ.

**Ba trụ cụ thể:** `shared: { singleton: true, requiredVersion }` dùng chung một file config; host giữ `BrowserRouter` duy nhất, remote dùng memory router + `basePath` + event đồng bộ; mỗi remote publish versioned (`/shop/1.2.0/remoteEntry.js`), host production pin version, preview `latest` + contract test CI.

### 2. Cấu hình `shared` với `singleton + requiredVersion` đúng, biết khi nào chấp nhận 2 bản

**Vì sao:** `singleton: true` ép một bản duy nhất (React bắt buộc — 2 bản là crash). `requiredVersion: '^19.0.0'` ép tương thích — lệch là MF tách 2 bản hoặc báo. Nhưng migration major (zustand v4→v5) cần 2 bản tạm có chủ đích — phải tuyên bố `singleton: false` + kế hoạch gộp, không để 2 bản ngầm (lỗi store đôi khó truy).

### 3. Phối hợp routing host/remote bằng `basename`/memory router và version hóa `remoteEntry.js`

Host là chủ URL thật (deep-link, Back, refresh). Remote là khách (lịch sử ảo, không đụng URL). Remote đổi path nội bộ thì bắn event để host cập nhật URL (giữ deep-link được). Deploy versioned để host chủ động nâng + rollback 2 bản gần nhất.

## Tổng quan

- Micro-frontend thất bại khi: 2 bản React crash, hai app fighting về URL, hoặc deploy chung dính lẫn nhau. Mỗi lỗi đều "đêm mới thấy" (production) vì dev/preview thường chỉ một remote.
- Bài này là "điều kiện để MF sống khỏe" sau khi đã làm `1-module-federation` (cơ chế) — tập trung vào version/dependency, routing, contract (kiểu dữ liệu trao đổi).
- Áp dụng từ khi ≥ 2 remotes thật dùng chung design-system/router; không cần nếu chỉ 1 app (thêm Federation vô ích).

## Khái niệm cốt lõi

### 1. Singleton + requiredVersion — một bản React duy nhất

```ts
// ✅ ĐÚNG: ép một bản, ép version tương thích — lệch là báo ngay lúc runtime/build
shared: { react: { singleton: true, requiredVersion: '^19.0.0' } }
```

**Vì sao:** 2 bản React = 2 reconciler + 2 hook state → `Invalid hook call` dù code đúng. Design-system 2 bản → theme lệch. Store 2 bản (zustand) → giỏ ở remote A, checkout ở remote B không thấy nhau. `singleton: true` + chung file `sharedDeps` là cách duy nhất giữ một bản.

**Sai thì sao:** host `react: ^18`, remote `react: ^19`, không `requiredVersion` → MF im lặng giữ 2 bản, crash hook lúc nửa đêm. Fix: chung file + `requiredVersion` + CI check version.

### 2. Lệch major có chủ đích — `singleton: false` tạm + kế hoạch gộp

Migration zustand v4→v5 không thể một đêm. Cho phép 2 bản tạm bằng `singleton: false` (hoặc `eager: false` + runtime check), ghi rõ "ai dùng bản nào, khi nào gộp", store dùng chung phải qua adapter tương thích hoặc tách theo biên. Hết migration là gộp ngay — 2 bản lâu là nợ.

### 3. Routing — host BrowserRouter duy nhất, remote memory + basePath

Host giữ URL thật (Back/refresh/deep-link). Remote `createMemoryRouter({ initialEntries: [basePath] })` — lịch sử ảo trong JS, không đụng URL. `basePath` do host truyền (`/shop` đang ở đâu). Remote nav nội bộ → bắn `remote:nav:app` event → host `navigate(path)` để URL thật theo kịp (giữ Back/refresh được). Remote tự `BrowserRouter` là đè URL host — cấm.

```tsx
// ❌ SAI (remote): BrowserRouter riêng — đè URL host, refresh mất route
<BrowserRouter><Routes>...</Routes></BrowserRouter>
// ✅ ĐÚNG (remote): memory + basePath từ host — URL thật do host giữ
const router = createMemoryRouter(routes, { initialEntries: [basePath] });
<RouterProvider router={router} />
```

### 4. Versioned deploy — pin production, `latest` chỉ preview + fallback

Mỗi remote publish `/shop/1.2.0/remoteEntry.js` (version trong URL). Host production pin `1.2.0` — remote release `1.3.0` không ảnh hưởng prod tới khi host chủ động nâng (sau test tích hợp preview). Preview trỏ `latest` để test sớm. Ngắt mạnh (remote chết) → iframe fallback hoặc trang lỗi thân thiện, không trắng host. Giữ 2 bản gần nhất trên CDN để rollback tức thì.

### 5. Contract test — props trao đổi có hợp đồng kiểu, CI hai bên cùng check

Host-remote trao đổi qua props (`{ basePath, userId }`) — remote đổi type mà host không biết là crash runtime mới thấy. Publish TS types chung (package) hoặc Pact contract, CI mỗi bên chạy check: lệch là đỏ trước khi merge, không đợi production.

## Luồng hoạt động / Cách áp dụng

### Bước 1. File `shared-deps.ts` chung host + remotes

Một nguồn sự thật — import vào config hai phía. Lệch config là 2 bản vô tình.

### Bước 2. Host `BrowserRouter`, truyền `basePath` qua customProps

Remote biết mình ở "thư mục" nào trong URL host để `initialEntries` đúng.

### Bước 3. Remote `createMemoryRouter`, không `BrowserRouter`

Lịch sử ảo, không tranh URL. `basename` riêng chỉ khi đồng bộ tay qua event đã chắc.

### Bước 4. Remote nav nội bộ → bắn event, host `navigate`

Giữ deep-link/Back/refresh xuyên remote-host. Event tên theo app (`remote:nav:shop`) để nhiều remote không lẫn.

### Bước 5. Publish versioned; prod pin, preview latest

Đổi remote không gãy host đêm. Nâng version là quyết định có chủ đích sau test tích hợp.

### Bước 6. Contract test + `tsc` chéo ở CI

Lệch props là đỏ trước merge. Dependency map ("ai dùng version nào") trong repo để review shared dễ.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), cộng remote + sync:

```ts
// shared-deps.ts — mirror đầy đủ, khớp từng dòng với example.tsx
// Import vào vite/rspack config của CẢ host + remotes — nguồn sự thật duy nhất, tránh lệch
export const sharedDeps = {
  // Một bản React duy nhất toàn hệ thống — 2 bản là Invalid hook call
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  zustand: { singleton: true }, // state dùng chung phải 1 bản — 2 bản là store đôi
} as const;

// Version pinning: production host trỏ URL versioned (chủ động nâng),
// preview trỏ 'latest' để test tích hợp sớm (gãy ở preview, không gãy prod).
export const remoteUrls = {
  production: 'https://cdn.example.com/shop/1.2.0/remoteEntry.js',
  preview: 'https://cdn.example.com/shop/latest/remoteEntry.js',
} as const;
```

```tsx
// remote/CartApp.tsx — nhận basePath từ host, dùng memory router (không tranh URL)
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// Vì sao memory: lịch sử ảo trong JS — Back/refresh/URL thật do host giữ, remote không đụng
const routes = [
  { path: '/', element: <CartList /> },
  { path: '/checkout', element: <Checkout /> },
];

export function RemoteApp({ basePath }: { basePath: string }) {
  // initialEntries: remote biết mình đang ở "thư mục" nào trong URL host (ví dụ /shop/checkout)
  const router = createMemoryRouter(routes, { initialEntries: [basePath] });
  return <RouterProvider router={router} />;
}
```

```ts
// host/RouteSync.tsx — lắng nghe remote đổi path để đồng bộ URL (custom event)
// Vì sao event: remote nav nội bộ (memory) host không biết — bắn event để URL thật theo kịp, giữ deep-link
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useRemotePathSync(appName: string) {
  const navigate = useNavigate();
  useEffect(() => {
    // Remote bắn 'remote:nav:shop' khi tự điều hướng nội bộ (ví dụ / → /checkout)
    const onNav = (e: Event) => {
      const { path } = (e as CustomEvent).detail; // path mới trong remote
      navigate(path); // host cập nhật URL thật + có thể deep-link/Back được
    };
    window.addEventListener(`remote:nav:${appName}`, onNav);
    return () => window.removeEventListener(`remote:nav:${appName}`, onNav); // dọn để không leak chéo app
  }, [navigate, appName]);
}
```

## Giải thích từng phần

### `sharedDeps` chung — không lệch config

Host + remote import cùng file → version/singleton luôn khớp. Lệch (mỗi phía một config tay) là 2 bản vô tình — lỗi chỉ hiện production khi hai bundle gặp nhau.

### `createMemoryRouter` — router riêng không chiếm URL

Remote có đủ routing nội bộ (/, /checkout) mà URL trình duyệt vẫn do host quyết. Refresh giữ route vì host render remote theo URL thật + truyền `basePath` tương ứng.

### `initialEntries: [basePath]` — remote biết vị trí mình

Deep-link `/shop/checkout` reload: host đọc URL, mount remote với `basePath='/shop/checkout'`, remote mở đúng /checkout nội bộ — không về trang chủ remote.

### Event `remote:nav` — nav nội bộ thành URL host

Không event: user bấm checkout trong remote, URL vẫn `/shop` — Back/refresh/copy link đều sai. Có event: URL thành `/shop/checkout` — mọi thao tác trình duyệt đúng.

### `remoteUrls.production` pin — nâng có chủ đích

Đổi remote không ép host theo. Host nâng sau khi preview xanh + contract test qua. Rollback = đổi URL về bản cũ (CDN giữ 2 bản gần nhất).

### Ma trận `singleton` (giữ từ README gốc + giải thích):

| Tình huống | `singleton` | Vì sao |
|---|---|---|
| `react`, `react-dom` | `true` bắt buộc | 2 bản → invalid hook call, crash ngay |
| Design system / theme | `true` | UI nhất quán, một theme |
| `zustand`/state chung | `true` | Một nguồn state duy nhất |
| Lib đang migration major | `false` tạm | 2 bản có chủ đích + kế hoạch gộp, không ngầm |
| Lib nặng một app dùng | `false` | Không share — remote tự mang, đỡ ràng buộc |

## Lỗi thường gặp / Chống chỉ định

### 1. Remote `BrowserRouter` → đè URL host

Remote memory + basePath như trên. `basename` riêng chỉ khi đã đồng bộ event chắc.

### 2. `shared` lệch → 2 bản vô tình

Chung file `sharedDeps`. CI check version hai phía (lệch là đỏ).

### 3. Deploy không pin → gãy đêm

Prod pin version, `latest` chỉ preview. Giữ 2 bản CDN để rollback. Log version remote đang chạy (performance entry/header) để debug.

### 4. Không đồng bộ URL → Back/refresh sai

Bắn `remote:nav` mỗi nav nội bộ; host `navigate` theo. Test Back/refresh/copy-link xuyên remote.

### 5. Không contract test → crash runtime mới biết

Publish types chung + CI check hai bên. Composition contract (name, version, exposes, shared JSON) để host tự kiểm tra remote khả dụng.

## Best practices / Mẹo

### Không import react riêng; contract JSON; semver + 2 bản CDN; log version; nâng major có kế hoạch

Remote không bao giờ `import('react')` bản riêng — luôn shared. Composition contract để CI host check. Semver + giữ 2 bản để rollback tức thì. Log version đang chạy để debug. Nâng major chung dùng `eager: false` + runtime check, không ép singleton mù. Dependency map trong repo. Tích hợp preview trước khi pin prod.

## Bài tập nhỏ

1. Remote A `zustand` v4, remote B v5, host singleton: cả hai cùng mount — store đôi (A không thấy B), theme/design có thể lệch, `requiredVersion` báo.
2. Đề xuất: v4/v5 tạm `singleton: false` (2 bản có chủ đích), store chung tách biên (mỗi remote store riêng) hoặc adapter tương thích.
3. Rollout: preview `latest` test tích hợp → contract test xanh → prod pin từng remote một (canary) → giữ bản cũ để rollback.
4. Viết CI check: version shared hai phía phải khớp `sharedDeps.ts`, lệch là đỏ.

## Reference

- [micro-frontends.org](https://micro-frontends.org/)
- [Module Federation — Shared modules](https://module-federation.io/guide/basic/)
- [react-router — Memory Router](https://reactrouter.com/api/react-router/createMemoryRouter)
- [Pact — contract testing](https://docs.pact.io/)
