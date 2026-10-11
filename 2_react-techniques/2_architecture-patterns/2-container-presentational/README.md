# Container–Presentational

> Nguồn: https://react.dev/learn/thinking-in-react

## Mục tiêu
- Tách component **lấy dữ liệu + xử lý logic** (container) khỏi component **hiển thị thuần** (presentational).
- Giúp UI dễ test (snapshot props), dễ tái dùng (đổi data source không đụng UI), dễ đọc.
- Trang bị tư duy phân lớp hữu ích khi kết hợp Server Components (Next.js/React Server Components).

## Tổng quan
Khi một component vừa fetch dữ liệu, vừa render giao diện, vừa xử lý trạng thái local, nó phình to và khó giữ "một việc một nơi". Pattern **Container–Presentational** (Dan Abramov) cắt đôi: **presentational** chỉ nhận `props` và vẽ (không gọi hook data, không có business logic), **container** lo data/state bằng hooks (TanStack Query, Zustand) và truyền xuống. Kết quả: đổi API chỉ sửa container; test UI chỉ cần truyền props giả; cùng một `UserCardView` dùng được cho cả danh sách lẫn trang detail. Áp dụng cho component có "hai nửa" rõ rệt; không dùng cho component lá tầm 10 dòng.

## Khái niệm cốt lõi
- **Presentational component** = "pure function of props": cùng props → cùng UI. Không fetch, không đọc store, không `useState`(nhiều); nếu cần tương tác thì nhận callback qua props (`onClick`, `onSelect`).
- **Container component** = nơi chứa "na ná controller": gọi `useQuery`/`useMutation`/store, quyết định loading/error UI, map dữ liệu thành props cho view.
- **Hooks là container hiện đại**: thay vì phải luôn tạo 2 component đúng cặp, ta thường gói logic vào custom hook (`useUser`) và gọi trong container — presentational vẫn thuần props.
- **Server Components (RSC)**: trong Next.js/RSC, *server component* là container tự nhiên (fetch trực tiếp trên server, gửi props xuống), *client component* là presentational tương tác — pattern này tái sinh dưới dạng built-in, không cần tự tổ chức.
- Phân biệt với **MVVM/hooks** (bài 3): container–presentational là phân chia component; MVVM tách ViewModel (state+logic) khỏi view qua custom hook — hai quan sát cùng một hiện tượng, khác từ khóa.

## Luồng hoạt động / Cách áp dụng
1. Xác định component "quá tải": vừa fetch vừa render, props chồng chất.
2. Tách `XView` (presentational): liệt kê props thuần + callback; bỏ mọi fetch/store.
3. Tạo `XContainer`/`useX`: gọi data hook, xử lý `isPending`/`isError`, map sang props của view.
4. Đặt view gần feature hoặc vào `shared/ui` nếu dùng chung; container ở `features/`.
5. Khi chuyển sang Server Components: giữ view client (cần state), chuyển container thành server.

## Ví dụ chi tiết
```tsx
// ---------- Presentational: thuần props, không fetch ----------
// Nhận đủ dữ liệu + callback; test bằng props giả không cần mock fetch
export type UserViewProps = {
  name: string;
  email: string;
  selected: boolean;
  onSelect: () => void;
};

export function UserCardView({ name, email, selected, onSelect }: UserViewProps) {
  return (
    <button
      onClick={onSelect}                  // tương tác "khai báo" qua callback
      aria-pressed={selected}             // accessibility: nút toggle chọn
      style={{ border: selected ? '2px solid blue' : '1px solid gray' }}
    >
      <strong>{name}</strong>             {/* chỉ render, không suy nghĩ */}
      <span>{email}</span>
    </button>
  );
}

// ---------- Container: quản lý state chọn ----------
import { useState } from 'react';

// Container lo "chọn ai", view không cần biết state từ đâu ra
export function UserCardContainer(props: Omit<UserViewProps, 'selected' | 'onSelect'>) {
  const [selected, setSelected] = useState(false); // state local của container
  return (
    <UserCardView
      {...props}                                   // truyền name/email nguyên vẹn
      selected={selected}
      onSelect={() => setSelected((s) => !s)}      // toggle khi bấm
    />
  );
}
```

Container với data từ TanStack Query (dạng chuẩn production):
```tsx
import { useQuery } from '@tanstack/react-query';
export function UserCardContainer({ id }: { id: number }) {
  const { data, isPending } = useQuery({
    queryKey: ['users', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  });
  if (isPending) return <p>Đang tải…</p>; // container quyết định trạng thái
  return <UserCardView name={data.name} email={data.email}
           selected={false} onSelect={() => console.log(id)} />;
}
```

## Giải thích từng phần
- `UserCardView` — không import gì về data: đây chính là điểm "easiest to test": `<UserCardView name="A" email="b@c" selected onSelect={fn}/>` chạy được trong mọi test renderer, không cần router/query provider.
- `Omit<UserViewProps, 'selected' | 'onSelect'>` — container nhận "mọi props trừ 2 cái nó tự quản", TypeScript bảo vệ hợp đồng giữa 2 lớp.
- `aria-pressed` biến button thành toggle chuẩn cho screen reader — ví dụ presentational vẫn giữ accessibility vì nó thuộc về giao diện.
- Việc `isPending`/`isError` nằm trong container → view không bao giờ render "undefined" hay quên xử lý lỗi.

## So sánh (nếu có)
- **Container–Presentational cổ điển vs Custom Hooks + View**: cổ điển tách bằng 2 component; hiện đại thường gói logic vào hook (`useUserCard`) rồi view gọi luôn — nhẹ hơn vì không phải tạo thêm component trung gian. Giữ pattern 2 component khi view phức tạp cần tách file/tái dùng.
- **Client-side separation vs Server Components**: container RSC fetch **trên server** (không gửi queryFn xuống client), presentational vẫn client khi cần state; client-only container giữ `useQuery`. Cùng ý tưởng "tách nơi lấy data khỏi nơi vẽ", nhưng RSC xóa cả chi phí fetch ở client.
- **Container–Presentational vs FSD layers (bài 1)**: pattern này là "vi phân" bên trong một slice — FSD nói *nơi* đặt, container–presentational nói *trách nhiệm trong file*.

## Lỗi thường gặp / Chống chỉ định
- **Tách 2 file cho mọi component** → số file tăng gấp đôi chỉ để có 5 dòng render; thêm chi phí điều hướng. Fix: chỉ tách khi component vượt ~50 dòng hoặc view dùng lại nhiều nơi.
- **Presentational gọi store/hook data** → lại thành "hybrid", mất khả năng test props thuần. Fix: đẩy hook lên container; nếu thấy view cần nhiều store quá, xét dùng context/viewmodel.
- **Truyền `{...rest}` mù quáng** → props thừa rò xuống DOM, khó gỡ lỗi. Fix: liệt kê props tường minh trong type.
- **Container ôm quá nhiều nguồn dữ liệu** → container 200 dòng; "controller phình". Fix: tách container theo từng nguồn (data container + interaction container) hoặc về hook.
- **Chống chỉ định**: component thuần không có logic (chỉ layout), hoặc logic nằm trong nhiều nơi phụ thuộc nhau — tách lớp sẽ tốn công "thông minh" mà không lợi.

## Câu hỏi thường gặp
- **Có phải lúc nào cũng tách 2 file?** Không. Chỉ tách khi component vượt ~50 dòng, vừa fetch vừa render, hoặc view được tái dùng nhiều nơi.
- **Presentational có được dùng `useState` không?** Về nguyên tắc hạn chế; state thuần hiển thị (mở/đóng tooltip) chấp nhận được, nhưng state nghiệp vụ phải ở container.
- **Server Components thay đổi gì?** Server component là container tự nhiên (fetch trên server); client component là presentational tương tác — pattern tái sinh kiểu built-in.
- **View dùng store trực tiếp được không?** Được về mặt kỹ thuật, nhưng làm mất tính "thuần props" và khó test; hãy để container/hook cung cấp props.
- **Làm sao test container?** Test hook logic bằng `renderHook` với mock query; test UI chỉ với presentational và props giả.

## Ghi chú 2026
- Với React 19 + RSC, "container" thường là server component; chỉ phần tương tác mới đánh dấu `'use client'`.
- React Compiler giảm lo về re-render của presentational thuần props — càng khuyến khích tách view.
- Kết hợp với FSD: view đặt trong `shared/ui` hoặc `features/x/ui`, container ở `features/x`.

## Best practices / Mẹo
- Đặt rule: **presentational chỉ có props + return JSX**; mọi thứ khác là container/hook. Luyện mắt đọc file 5 giây biết loại.
- Đặt view trong `shared/ui` (dùng chung) hoặc trong thư mục feature; container ở `features/x/container-*`.
- Viết test UI bằng `@testing-library/react` *chỉ với presentational* (props giả) — nhanh hơn nhiều so với mock toàn bộ data layer.
- Khi dùng TanStack Query làm container: container chỉ 5–8 dòng, phần lớn sức nặng rơi vào hook `useXQuery` — giữ container mỏng.
- Cho view `displayName`/file riêng để React DevTools hiển thị rõ ràng, không lẫn lộn container/view.

## Bài tập nhỏ
Xây danh sách sản phẩm: `ProductCardView` (thuần props: name, price, inCart, onToggleCart) + `ProductCardContainer` (useQuery `['products', id]`, giữ state inCart local). Viết test snapshot cho view với props giả; test container có mock query. Sau đó tách hook `useProductCard(id)` và bỏ container component — so sánh: code ít hơn bao nhiêu dòng, test vẫn còn ý nghĩa?

## Reference
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Passing Props (React)](https://react.dev/learn/passing-props-to-a-component)
- [Server Components](https://react.dev/reference/rsc/server-components)