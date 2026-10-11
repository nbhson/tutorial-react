# Feature-Sliced + bulletproof-react

> Nguồn: https://feature-sliced.design/ — https://github.com/alan2207/bulletproof-react

## Mục tiêu
- Chia code theo **feature nghiệp vụ** thay vì theo loại file kỹ thuật (components/, hooks/, utils/ phẳng).
- Thiết lập **quy tắc import một chiều** giữa các tầng (layer) để code dễ hiểu, dễ thay đổi, dễ test.
- Đóng gói mỗi slice bằng **public API** (index.ts) — cấm import sâu vào nội bộ.

## Tổng quan
Ứng dụng phát triển tự do thường rơi vào "thư mục spaghetti": 100 component, 50 hook, 30 util không rõ nơi ấy thuộc về đâu, ai được dùng ai. **Feature-Sliced Design (FSD)** và **bulletproof-react** đưa ra cấu trúc tầng bậc có luật chơi:

- **Layers của FSD** (từ cao xuống thấp): `app → pages → widgets → features → entities → shared`. Quy tắc vàng: **chỉ được import từ tầng thấp hơn mình** (features dùng entities + shared, nhưng entities không được import features).
- **bulletproof-react** (alan2207) là bộ quy ước thực dụng đồng thời: alias `@/`, tách `components`–`features`–`hooks`–`lib`–`providers`–`stores`–`types`–`config`, mỗi feature gom `api/`, `components/`, hooks riêng.
- Cách 2 phong cách này hội tụ ở ý chính: *nhóm code theo chức năng nghiệp vụ, giới hạn phạm vi phụ thuộc*, để thêm một tính năng mới không phải đụng vào hàng chục file vô can.

Áp dụng khi: app vượt ~10–20 màn hình, nhiều dev làm chung, hoặc dự án dài hạn cần scale.

## Khái niệm cốt lõi
- **Layer** = tầng ngang; **slice** = đơn vị chức năng bên trong tầng (một slice là một "tính năng" hoặc một "entity"); **segment** = loại file trong slice (`ui/`, `api/`, `model/`, `lib/`).
- **Quy tắc import (lập lờ bậc thang)**: `app` có thể import tầng nào cũng được; `features` không được import `pages`; trong cùng tầng, các slice **không được import lẫn nhau** (muốn dùng phải đẩy xuống entities/shared hoặc nâng thành widget).
- **Public API**: mỗi slice chỉ lộ `index.ts` — file được phép import từ bên ngoài. Import sâu `@/features/cart/model/store` → bị cấm vì phá vỡ đóng gói; muốn "mở lối" thì export qua index.
- **Entity vs Feature**: *entity* là object nghiệp vụ xuyên suốt (Product, User — dùng lại nhiều nơi); *feature* là hành động người dùng (AddToCart, LoginForm) thường đặt trên một entity hoặc business unit.

## Luồng hoạt động / Cách áp dụng
1. Dựng khung `src/{app,pages,widgets,features,entities,shared}` (FSD) hoặc bộ thư mục của bulletproof-react, cài alias `@/`.
2. Đặt dữ liệu người dùng hay tái dùng (Product, User, Cart) vào `entities/` kèm `api/` + `types/`.
3. Action nghiệp vụ cụ thể (thêm giỏ, form đăng nhập, bộ lọc) vào `features/`.
4. UI chắp nối nhiều feature lại làm `widgets/`; trang trống chỉ lắp widget → `pages/`; glue global (providers, router, theme) → `app/`; UI-kit + fetcher + utils → `shared/`.
5. Viết `index.ts` public API cho mỗi slice; chạy rule ESLint (`boundaries`/`import` restrictions) để bảo vệ quy tắc import.

## Ví dụ chi tiết
```tsx
// features/cart/add-to-cart.tsx — ví dụ slice đúng tầng
// Slice nằm ở tầng features → chỉ được dùng entities + shared
import { useState } from 'react';

// entities/cart/store.ts (giả lập — thực tế dùng Zustand)
// "entity" Cart giữ state nghiệp vụ dùng chung, features/pages cùng đọc
function useAddToCart() {
  const [pending, setPending] = useState(false); // trạng thái của hành động
  return {
    pending,
    add: async (id: number) => {
      setPending(true);                       // bật trạng thái đang gửi
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ id }),         // giao tiếp qua shared/api client
      });
      setPending(false);                      // xong thì tắt
    },
  };
}

// shared/ui/button.tsx (giả lập) — UI-kit dùng chung mọi tầng
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}

export function AddToCart({ id }: { id: number }) {
  const { add, pending } = useAddToCart(); // features chỉ dùng entity + shared
  return (
    <Button disabled={pending} onClick={() => add(id)}>
      {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}
    </Button>
  );
}
```

## Giải thích từng phần
- `features/cart/…` — toàn bộ "thêm vào giỏ" nằm một nơi: UI, state, gọi API. Thêm tính năng khác (xóa khỏi giỏ) cũng nằm `features/cart/`, không rải rác khắp components/.
- `useAddToCart` giả lập entity — thực tế là `entities/cart/store` với Zustand; component feature **không tự tạo fetch** lộn xộn mà dùng entity/shared api client → dependency rõ ràng.
- `Button` từ `shared/ui` — một component dùng chung cho 100 places; đổi style 1 chỗ, cả app đổi theo.
- Import chỉ theo chiều lên: `AddToCart (features) → useAddToCart (entities) → Button (shared)`. Không chiều ngược: shared không biết features tồn tại.

## So sánh (nếu có)
- **Bố cục theo loại file phẳng (`components/`, `hooks/`, `utils/`) vs FSD**: phẳng dễ bắt đầu cho app nhỏ nhưng tới lúc 50+ file thì "component này của tính năng nào?" — vô phương; FSD đặt tên theo miền nghiệp vụ nên tìm file theo tên tính năng, import theo luật.
- **bulletproof-react vs FSD**: bulletproof gọn hơn (chia theo `features/`, `components/`, `lib/`…) và ít tầng hơn (không có `widgets`); FSD chuẩn mực hơn cho team lớn, muốn luật import nghiêm. Dùng bulletproof cho 5–15 dev, FSD cho hệ thống lớn/cần stable contract.
- **"Folder by type" vs "Folder by feature"**: by-type dễ tái dùng (cùng chỗ tất cả Button) nhưng khó biết "tính năng X ở đâu"; by-feature gom mọi thứ của X một chỗ — đánh đổi: cần kỷ luật để không lặp code giữa các feature.

## Lỗi thường gặp / Chống chỉ định
- **Import ngược tầng** (shared import features, entities đọc widget) → vòng phụ thuộc, build chậm, đúng "race" bug. Fix: chạy ESLint rule import restriction + code review; thiết kế lại theo chiều lên.
- **Import sâu vào slice** (`@/features/cart/model/store` thay vì `@/features/cart`) → sửa nội bộ entity làm vỡ nơi khác. Fix: chỉ export cần thiết qua `index.ts`, xem như "public API contract".
- **Đặt business logic trong component UI** của shared/widget → logic rải rác, khó test. Fix: logic nằm trong `model/`/hook của entity/feature, UI chỉ render.
- **Slice quá lớn / quá nhỏ**: slice "utils" hay "misc" vô nghĩa, slice 1 hàm cũng thừa. Fix: đặt theo ranh giới nghiệp vụ rõ (cart, auth, profile), bắt đầu 3–5 slice rồi tách dần.
- **Chống chỉ định**: app prototype/nhỏ (< 5 màn hình) hoặc team 1 người ship nhanh — áp FSD ngày 1 chỉ thêm 5 thư mục trống và cảm giác nặng nề. Bắt đầu bằng bulletproof-style tối giản, nâng cấp dần.

## Câu hỏi thường gặp
- **Dự án nhỏ có cần FSD không?** Không nhất thiết. Bắt đầu bằng cấu trúc bulletproof tối giản (`features/`, `shared/`), chỉ tách đủ tầng khi quy mô/team tăng.
- **`widgets` khác `features` thế nào?** Feature = một hành động/hành vi người dùng; widget = khối UI độc lập lắp nhiều feature/entity lại (header, feed) dùng ở nhiều page.
- **`entities` khác `features` ra sao?** Entity là model nghiệp vụ tái sử dụng (Product, User); feature là hành động cụ thể trên/thêm quanh entity (AddToCart, FollowUser).
- **Làm sao cưỡng chế quy tắc import?** Dùng ESLint `boundaries`/`import/no-restricted-paths`, hoặc plugin `eslint-plugin-boundaries`; biến luật thành lỗi CI thay vì dựa kỷ luật.
- **Có được import chéo giữa các feature không?** Không (cùng tầng cấm chéo). Nếu cần, đẩy phần chung xuống `entities`/`shared` hoặc nâng quan hệ lên `widgets`/`app`.

## Ghi chú 2026
- FSD v2/v3 định nghĩa rõ `@x` cross-import notation cho phép ngoại lệ có kiểm soát giữa các entity.
- bulletproof-react vẫn là repo tham chiếu cấu trúc `features/` + `lib/` + `providers/`; kết hợp alias `@/`.
- Với monorepo, áp FSD giúp tách package theo layer và dùng workspace để cưỡng chế phụ thuộc.

## Best practices / Mẹo
- Dùng alias `@/*` (Vite `resolve.alias`) để import ngắn và chuyển thư mục không phá file.
- Cài ESLint `import/no-restricted-paths` hoặc plugin `boundaries` để **biến quy tắc import thành lỗi tự động**, không phụ thuộc kỷ luật.
- Entity đi kèm `api/` + `types/` + `model/` trong cùng slice — "self-contained": đổi API chỉ đụng trong slice đó.
- `shared/` chỉ chứa thứ **thực sự dùng chung**; nếu chỉ 2 nơi dùng, để feature nắm (nhân bản nhẹ còn hơn coupling không đáng).
- Mỗi PR chỉ "chạm" các slice thuộc 1 feature + tối đa 1–2 slice khác — đó là dấu hiệu cấu trúc còn khỏe.
- Đặt README kiến trúc trong `src/` mô tả luật import — người mới đọc là hiểu ngay.
- Khi một slice phình to, tách theo segment (`ui`, `model`, `api`) trước khi tách nguyên slice mới.
- Tạo template generator (plop/hygen) để thêm slice đúng chuẩn, tránh sai tầng.
- Kiểm tra vòng phụ thuộc bằng `madge`/`dependency-cruiser` trong CI.
- Đặt tên slice theo danh từ nghiệp vụ (cart, auth), không theo kỹ thuật (common, utils).
- Giữ `shared/` thuần — không import router/env để dễ test.
- Export qua `index.ts` tường minh, tránh `export *` gây lộ nội bộ.
- Viết script kiểm tra import boundary chạy trong pre-commit để chặn vi phạm sớm.
- Giữ mỗi slice self-contained: types + api + model nằm cùng thư mục.

## Bài tập nhỏ
Dựng lại app "todos" 2 trang (danh sách + chi tiết) theo FSD: đặt `Todo` vào `entities/todo/` (types + api + store Zustand), `TodoFilter` + `ToggleTodo` vào `features/todo/`, `TodoList` (chắp nối) vào `widgets/`, trang `pages/`, theme + provider vào `app/`, `Button` + `fetcher` vào `shared/`. Viết 2 test: (1) shared không import entities/features; (2) features không import pages. Xem ESLint bắt lỗi ra sao khi cố tình import ngược.

## Reference
- [Feature-Sliced Design](https://feature-sliced.design/)
- [bulletproof-react](https://github.com/alan2207/bulletproof-react)
- [React docs — Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)