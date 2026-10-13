# Feature-Sliced + bulletproof-react

> Nguồn: https://feature-sliced.design/ — https://github.com/alan2207/bulletproof-react

## Mục tiêu

### 1. Chia code theo feature nghiệp vụ thay vì theo loại file kỹ thuật (components/, hooks/, utils/ phẳng)

**Vì sao:** thư mục phẳng (`components/` 100 file, `hooks/` 50 file, `utils/` 30 file) không trả lời được "tính năng giỏ hàng nằm ở đâu, chạm vào có vỡ gì". Thêm một tính năng phải sửa rải rác 10 nơi, xóa một tính năng không biết còn ai dùng. Chia theo feature gom mọi thứ của một nghiệp vụ (UI, state, API, type) vào một slice — đọc tên slice là biết phạm vi, xóa slice là xóa tính năng.

**Cơ chế:** mỗi slice là một thư mục tự chứa (`features/cart/` gồm `ui/`, `model/`, `api/`). Muốn hiểu "thêm vào giỏ" chỉ mở một thư mục. Muốn tái dùng thì đẩy xuống `entities`/`shared`; muốn chắp nối thì nâng lên `widgets`/`pages`. Không còn file "vô chủ" nằm ở `utils/misc`.

**Sai thì sao:**

```tsx
// ❌ SAI: folder by type — AddToCart rải 4 nơi, không biết thuộc về ai
// components/AddToCart.tsx + hooks/useCart.ts + api/cart.ts + utils/cartHelper.ts
// Sửa giá phải mở 4 thư mục, xóa tính năng sợ sót file

// ✅ ĐÚNG: folder by feature — mọi thứ của cart một chỗ
// features/cart/{ui/AddToCart.tsx, model/useAddToCart.ts, api/cartApi.ts, index.ts}
```

**Usecase thực tế:** app 20 màn hình, 5 dev. Dev A làm giỏ hàng, dev B làm auth — mỗi người chỉ chạm slice của mình, PR không conflict. Quy tắc nhận diện "khi nào dùng": app vượt ~10 màn hình, hoặc hai người trở lên sửa chung, hoặc dự án sống > 6 tháng → áp ngay. Prototype 3 màn hình một người ship nhanh → bulletproof tối giản, nâng dần.

### 2. Thiết lập quy tắc import một chiều giữa các tầng để dễ hiểu, dễ thay đổi, dễ test

**Vì sao:** không luật, `shared/Button` import `features/cart/store` (ngược tầng) tạo vòng phụ thuộc: sửa cart vỡ Button, Button vỡ 100 nơi. Build chậm, test phải mock cả thế giới, bug "race" khó truy. Luật một chiều (chỉ import tầng thấp hơn) biến dependency thành DAG — sửa tầng thấp ảnh hưởng có kiểm soát, sửa tầng cao không lan xuống.

**Cơ chế:** tầng từ cao xuống thấp `app → pages → widgets → features → entities → shared`. `features` được dùng `entities` + `shared`; `entities` không được biết `features`; cùng tầng cấm import chéo (hai feature muốn dùng chung phải đẩy xuống entity/shared hoặc nâng lên widget). Cưỡng chế bằng ESLint `boundaries`/`import/no-restricted-paths` thành lỗi CI, không dựa kỷ luật miệng.

### 3. Đóng gói mỗi slice bằng public API (`index.ts`) — cấm import sâu

**Vì sao:** cho phép `import {x} from '@/features/cart/model/store'` nghĩa là nội bộ slice lộ hết — đổi tên file trong slice vỡ 20 nơi ngoài. `index.ts` là hợp đồng: slice lộ gì thì export ở đó, còn lại là chi tiết triển khai được tự do refactor.

```ts
// ❌ SAI: import sâu — sửa nội bộ vỡ nơi khác
import { useCartStore } from '@/features/cart/model/store';
// ✅ ĐÚNG: chỉ qua public API
import { AddToCart } from '@/features/cart'; // index.ts quyết định lộ gì
```

## Tổng quan

Ứng dụng phát triển tự do thường rơi vào "thư mục spaghetti": 100 component, 50 hook, 30 util không rõ nơi ấy thuộc về đâu, ai được dùng ai. **Feature-Sliced Design (FSD)** và **bulletproof-react** đưa ra cấu trúc tầng bậc có luật chơi:

- **Layers của FSD** (từ cao xuống thấp): `app → pages → widgets → features → entities → shared`. Quy tắc vàng: **chỉ được import từ tầng thấp hơn mình** (features dùng entities + shared, nhưng entities không được import features). `app` (providers, router, theme) được import mọi tầng; `pages` chỉ lắp widget (trang trống); `widgets` chắp nối nhiều feature/entity (header, feed); `features` là hành động user (AddToCart, LoginForm); `entities` là object nghiệp vụ tái dùng (Product, User, Cart); `shared` là UI-kit/fetcher/utils thuần.

- **bulletproof-react** (alan2207) là bộ quy ước thực dụng đồng thời: alias `@/`, tách `components`–`features`–`hooks`–`lib`–`providers`–`stores`–`types`–`config`, mỗi feature gom `api/`, `components/`, hooks riêng. Ít tầng hơn FSD, dễ bắt đầu hơn cho team 5–15 người.

- Cách 2 phong cách này hội tụ ở ý chính: *nhóm code theo chức năng nghiệp vụ, giới hạn phạm vi phụ thuộc*, để thêm một tính năng mới không phải đụng vào hàng chục file vô can. Mỗi PR chỉ chạm các slice thuộc 1 feature + tối đa 1–2 slice khác — đó là dấu hiệu cấu trúc còn khỏe.

Áp dụng khi: app vượt ~10–20 màn hình, nhiều dev làm chung, hoặc dự án dài hạn cần scale. Bắt đầu bằng bulletproof tối giản (`features/`, `shared/`), nâng lên FSD đầy đủ khi team/quy mô tăng.

## Khái niệm cốt lõi

### 1. Layer / Slice / Segment — ba cấp tổ chức

**Vì sao:** chỉ có "thư mục" mà không có cấp sẽ sinh slice khổng lồ hoặc slice 1 hàm. Ba cấp cho chỗ đứng rõ: layer là tầng ngang (ai được dùng ai), slice là đơn vị nghiệp vụ trong tầng (cart, auth, product), segment là loại file trong slice (`ui/`, `api/`, `model/`, `lib/`). Khi slice phình, tách theo segment trước khi tách slice mới.

**Cơ chế:** `features/cart/ui/AddToCart.tsx` (render) + `features/cart/model/useAddToCart.ts` (logic) + `features/cart/api/cartApi.ts` (fetch). Đổi API chỉ đụng `api/` trong slice; đổi luật chỉ đụng `model/`; đổi giao diện chỉ đụng `ui/`.

```
src/
  app/        # providers, router, theme — glue global
  pages/      # trang trống, chỉ lắp widget
  widgets/    # khối UI độc lập lắp nhiều feature (Header, Feed)
  features/   # hành động user (cart/add-to-cart, auth/login-form)
    cart/
      ui/ model/ api/ index.ts
  entities/   # object tái dùng (product, user, cart + types/api/store)
  shared/     # UI-kit, fetcher, utils thuần — không biết feature nào
```

### 2. Quy tắc import một chiều — thang chỉ đi xuống

**Vì sao:** chiều duy nhất này là thứ khiến refactor an toàn. `app` import đâu cũng được (nó là đỉnh); `features` không được import `pages` (đáy không biết đỉnh); cùng tầng cấm chéo (hai feature không đọc nhau). Vi phạm tạo cycle: A import B, B import A → bundler/test quay vòng, HMR chậm, bug khởi tạo.

**Sai thì sao:**

```ts
// ❌ SAI: entities đọc features — ngược tầng, tạo vòng
// entities/product/model.ts
import { useCart } from '@/features/cart'; // entity biết feature → cycle

// ✅ ĐÚNG: features đọc entities — xuôi chiều
// features/cart/ui/AddToCart.tsx
import { useProduct } from '@/entities/product'; // feature dùng entity
// Muốn hai feature chia sẻ → đẩy xuống entities/shared hoặc nâng lên widgets
```

### 3. Public API — `index.ts` là hợp đồng

**Vì sao:** không hợp đồng, mọi file nội bộ đều là "public" — refactor là vỡ. Có hợp đồng, slice tự do đổi cấu trúc trong (tách `model/` thành 3 file) mà ngoài không hay.

```ts
// features/cart/index.ts — chỉ lộ thứ cần thiết
export { AddToCart } from './ui/AddToCart';
// KHÔNG export model/store nội bộ → ngoài không với tới, không phụ thuộc
```

### 4. Entity vs Feature — object tái dùng vs hành động user

**Entity** là danh từ nghiệp vụ xuyên suốt (Product, User, Cart) — dùng ở 10 nơi, có `types` + `api` + `store`. **Feature** là động từ của user (AddToCart, LoginForm, TodoFilter) — thường đứng trên entity, gom UI + hook + gọi API cho một hành vi. Nhầm (đặt Product vào features) khiến 10 nơi import từ một feature cụ thể — sai tầng, khó tái dùng.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Dựng khung + alias `@/`

Tạo `src/{app,pages,widgets,features,entities,shared}` (FSD) hoặc bộ bulletproof, cài `resolve.alias` + `tsconfig paths` để import ngắn. Viết README kiến trúc trong `src/` mô tả luật — người mới đọc là hiểu.

### Bước 2. Đặt entity tái dùng vào `entities/` kèm `api/` + `types/`

Product, User, Cart — mỗi entity self-contained: đổi API chỉ đụng trong slice đó. Kèm store Zustand nếu entity có state.

### Bước 3. Đặt hành động user vào `features/`

Thêm giỏ, form login, bộ lọc — mỗi feature gom UI + hook + API call. Không tự tạo fetch lộn xộn, dùng entity/shared api client.

### Bước 4. Chắp nối widget → page → app; gom dùng chung vào shared

Widget lắp nhiều feature (Header gồm Search + CartBadge + UserMenu). Page chỉ lắp widget (trang trống). `app/` giữ providers/router/theme. `shared/` chỉ thứ thực sự dùng chung (Button, fetcher) — nếu chỉ 2 nơi dùng, để feature nắm còn hơn coupling.

### Bước 5. Viết `index.ts` + bật ESLint boundaries + kiểm tra cycle

Mỗi slice một `index.ts` tường minh (tránh `export *` lộ nội bộ). Cài `eslint-plugin-boundaries`/`import/no-restricted-paths` để luật thành lỗi CI. Chạy `madge`/`dependency-cruiser` mỗi PR để bắt vòng.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// features/cart/add-to-cart.tsx — ví dụ slice đúng tầng
// Slice nằm ở tầng features → chỉ được dùng entities + shared (không được đọc pages/widgets)
import { useState } from 'react';

// entities/cart/store.ts (giả lập — thực tế dùng Zustand)
// "entity" Cart giữ state nghiệp vụ dùng chung, features/pages cùng đọc
// Vì sao giả lập ở đây: demo một file cho gọn; dự án thật tách entities/cart/store.ts riêng
function useAddToCart() {
  const [pending, setPending] = useState(false); // trạng thái của hành động (đang gửi hay không)
  return {
    pending,
    add: async (id: number) => {
      setPending(true); // bật trạng thái đang gửi → Button disabled, tránh bấm đúp
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ id }), // giao tiếp qua shared/api client (ở đây fetch thẳng cho gọn)
      });
      setPending(false); // xong thì tắt → Button bấm lại được
    },
  };
}

// shared/ui/button.tsx (giả lập) — UI-kit dùng chung mọi tầng
// Vì sao ở shared: Button dùng ở 100 nơi, đổi style 1 chỗ cả app đổi theo; shared không biết feature nào
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}

export function AddToCart({ id }: { id: number }) {
  const { add, pending } = useAddToCart(); // features chỉ dùng entity + shared — đúng chiều import
  return (
    <Button disabled={pending} onClick={() => add(id)}>
      {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}
    </Button>
  );
}
```

Public API đi kèm (pattern chuẩn):

```ts
// features/cart/index.ts — hợp đồng của slice (file cần thêm cạnh example)
export { AddToCart } from './add-to-cart';
// Chỉ lộ AddToCart; useAddToCart nội bộ không export → ngoài không phụ thuộc chi tiết
```

## Giải thích từng phần

### `features/cart/…` — toàn bộ "thêm vào giỏ" một nơi

UI, state, gọi API nằm cùng slice. Thêm tính năng "xóa khỏi giỏ" cũng nằm `features/cart/`, không rải `components/` + `hooks/` + `api/`. Xóa tính năng chỉ xóa một thư mục. **Sai thì sao:** đặt `useAddToCart` ở `hooks/` chung, `AddToCart` ở `components/` chung → sửa giá phải mở 3 thư mục, không biết còn ai dùng hook đó.

### `useAddToCart` — entity qua hook, không fetch lộn xộn

Thực tế là `entities/cart/store` (Zustand) + `shared/api` client. Component feature không tự `fetch` với URL cứng rải rác mà dùng entity/shared → dependency rõ, đổi base URL một chỗ. `pending` chặn bấm đúp — chi tiết nhỏ nhưng thiếu là bug double-submit.

### `Button` từ `shared/ui` — UI-kit một chỗ

100 nơi dùng chung một Button. Đổi radius/màu một file, cả app theo. Shared thuần (không import router/env) nên test dễ, không kéo dependency nghiệp vụ.

### Chiều import `features → entities → shared` — không chiều ngược

`AddToCart (features)` gọi `useAddToCart (entities)` và `Button (shared)`. Shared không biết features tồn tại. Đảo lại (shared import features) là cycle — ESLint boundaries phải báo đỏ.

## So sánh (nếu có)

### Folder phẳng by-type vs FSD by-feature

Phẳng: dễ bắt đầu (3 thư mục là chạy), nhưng 50+ file thì "component này của tính năng nào?" vô phương, sửa một tính năng chạm 10 nơi. FSD: tìm file theo tên nghiệp vụ, import theo luật, xóa slice là xóa tính năng. Đánh đổi: cần kỷ luật (index.ts, boundaries) và vài thư mục trống lúc đầu.

### bulletproof-react vs FSD

bulletproof gọn (không có `widgets`, ít tầng), hợp team 5–15 người, bắt đầu nhanh. FSD chuẩn mực, hợp hệ thống lớn/team đông cần contract ổn định. Dùng bulletproof trước, khi slice phình và cần `widgets` thì nâng lên FSD — hai hệ không đối đầu mà là hai nấc cùng thang.

### Folder by-type vs by-feature — tái dùng vs định vị

By-type dễ tái dùng (mọi Button một chỗ) nhưng khó định vị tính năng. By-feature dễ định vị nhưng cần kỷ luật để không lặp code giữa feature (đẩy phần chung xuống shared khi có nơi thứ ba dùng).

## Lỗi thường gặp / Chống chỉ định

### 1. Import ngược tầng → vòng phụ thuộc

```ts
// ❌ SAI: shared biết features — cycle, build chậm, bug khởi tạo
// shared/ui/Button.tsx
import { useCart } from '@/features/cart';
// ✅ ĐÚNG: features biết shared — xuôi chiều
// features/cart/ui/AddToCart.tsx
import { Button } from '@/shared/ui';
```

### 2. Import sâu vào slice → vỡ đóng gói

```ts
// ❌ SAI: với tay vào nội bộ — đổi tên file là vỡ
import { store } from '@/features/cart/model/store';
// ✅ ĐÚNG: qua public API
import { AddToCart } from '@/features/cart';
```

### 3. Business logic trong UI shared/widget → rải rác, khó test

Logic nằm `model/`/hook của entity/feature, UI chỉ render. Đặt `fetch` + tính giá trong `Button` là sai chỗ — Button thành nơi chứa nghiệp vụ của 10 tính năng.

### 4. Slice quá lớn ("misc/utils") hoặc quá nhỏ (1 hàm)

Đặt theo ranh giới nghiệp vụ rõ (cart, auth, profile). Bắt đầu 3–5 slice, tách dần. Slice "common" vô nghĩa — mọi thứ đều common nghĩa là không gì common.

### 5. Chống chỉ định: prototype nhỏ/team 1 người

< 5 màn hình ship nhanh — FSD ngày 1 chỉ thêm 5 thư mục trống và cảm giác nặng. Bắt đầu bulletproof tối giản, nâng dần khi quy mô/team tăng.

## Câu hỏi thường gặp

### Dự án nhỏ có cần FSD không?

Không nhất thiết. Bắt đầu `features/` + `shared/`, chỉ tách đủ tầng khi quy mô tăng. Áp sớm quá là over-engineering; áp muộn quá là refactor đau. Dấu hiệu cần: PR chạm > 3 tính năng không liên quan, hoặc không biết file mới đặt ở đâu.

### `widgets` khác `features` thế nào?

Feature = một hành vi user (AddToCart). Widget = khối UI độc lập lắp nhiều feature/entity (Header gồm Search + CartBadge + UserMenu) dùng ở nhiều page. Feature không biết widget; widget biết feature.

### `entities` khác `features` ra sao?

Entity = model tái dùng (Product, User). Feature = hành động trên entity (AddToCart, FollowUser). Entity không biết feature nào dùng mình; feature biết mình đứng trên entity nào.

### Làm sao cưỡng chế luật import?

ESLint `boundaries`/`import/no-restricted-paths` + `madge`/`dependency-cruiser` trong CI. Luật miệng không giữ được quá 2 tuần; luật máy giữ được mãi.

### Có được import chéo giữa các feature không?

Không. Cần chung → đẩy xuống `entities`/`shared`; cần chắp nối → nâng lên `widgets`/`app`. Ngoại lệ có kiểm soát dùng `@x` notation của FSD v2/v3 và ghi lý do.

## Ghi chú 2026

- **FSD v2/v3 + `@x` cross-import:** cho phép ngoại lệ có kiểm soát giữa các entity (ghi rõ trong code vì sao), thay vì cấm tuyệt đối gây workaround bẩn.
- **bulletproof-react vẫn là tham chiếu `features/` + `lib/` + `providers/`:** kết hợp alias `@/` và template generator (plop/hygen) để thêm slice đúng chuẩn.
- **Monorepo:** áp FSD giúp tách package theo layer, dùng workspace để cưỡng chế phụ thuộc ở tầng package (mạnh hơn cả ESLint).

## Best practices / Mẹo

### Alias `@/*` + ESLint boundaries thành lỗi CI

Import ngắn, chuyển thư mục không vỡ file. Luật thành lỗi tự động — không phụ thuộc kỷ luật. Đọc build log "bail out" để biết component nào chưa tuân thủ.

### Entity self-contained (`api/` + `types/` + `model/` cùng slice)

Đổi API chỉ đụng trong slice. `shared/` chỉ thứ thực sự dùng chung; mỗi PR chỉ chạm 1 feature + tối đa 1–2 slice khác.

### Template generator + README kiến trúc + tên slice danh từ nghiệp vụ

Plop/hygen sinh slice đúng chuẩn (tránh sai tầng). README trong `src/` mô tả luật cho người mới. Tên slice là danh từ nghiệp vụ (cart, auth), không phải kỹ thuật (common, utils). Export tường minh qua `index.ts`, tránh `export *`.

## Bài tập nhỏ

Dựng app "todos" 2 trang (danh sách + chi tiết) theo FSD:

1. `Todo` vào `entities/todo/` (types + api + store Zustand); `TodoFilter` + `ToggleTodo` vào `features/todo/`; `TodoList` vào `widgets/`; trang vào `pages/`; theme + provider vào `app/`; `Button` + `fetcher` vào `shared/`.
2. Viết `index.ts` cho mỗi slice, chỉ export thứ cần.
3. Viết 2 test/ESLint check: (1) shared không import entities/features; (2) features không import pages. Cố tình import ngược để xem ESLint báo đỏ ra sao.
4. Chạy `madge --circular src` xác nhận không có vòng. Ghi lại: file nào được sửa, file nào trở nên sạch, PR chạm mấy slice.

## Reference

- [Feature-Sliced Design](https://feature-sliced.design/)
- [bulletproof-react](https://github.com/alan2207/bulletproof-react)
- [React docs — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
