# Container–Presentational

> Nguồn: https://react.dev/learn/thinking-in-react

## Mục tiêu

Mục này nói về ba đích của bài: tách component "lấy data" khỏi component "vẽ giao diện", và lợi ích đi kèm. Đọc để thấy bài giải bài toán component phình to như thế nào.

- Tách component **lấy dữ liệu + xử lý logic** (container) khỏi component **hiển thị thuần** (presentational).
- Giúp UI dễ test (snapshot props), dễ tái dùng (đổi data source không đụng UI), dễ đọc.
- Trang bị tư duy phân lớp hữu ích khi kết hợp Server Components (Next.js/React Server Components).

> **Tóm gọn 1 câu:** Container là "đầu bếp lo nấu", presentational là "nhân viên bưng trình" — chia vai xong thì ai test việc nấy, đổi công thức không đụng cách bưng.

## Tổng quan

Mục này nói về nguyên lý của pattern: vì sao một component gánh cả ba việc là rủi ro, và cách cắt đôi nó.

Khi một component vừa fetch dữ liệu, vừa render giao diện, vừa xử lý trạng thái local, nó phình to và khó giữ "một việc một nơi" — như một người vừa nấu ăn, vừa bưng bàn, vừa tính tiền, khách đông là loạn cả quán. Pattern **Container–Presentational** (Dan Abramov) cắt đôi: **presentational** chỉ nhận `props` và vẽ (không gọi hook data, không có business logic), **container** lo data/state bằng hooks (TanStack Query, Zustand) và truyền xuống. Kết quả: đổi API chỉ sửa container; test UI chỉ cần truyền props giả; cùng một `UserCardView` dùng được cho cả danh sách lẫn trang detail. Áp dụng cho component có "hai nửa" rõ rệt; không dùng cho component lá tầm 10 dòng.

> **Tóm gọn 1 câu:** Cắt component thành đầu bếp (container lo data) và bưng món (presentational chỉ vẽ theo props) — đổi nguồn nguyên liệu không đụng cách trình bày.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của pattern — đọc để hiểu ranh giới giữa hai vai trước khi xem code.

- **Presentational component** = "pure function of props": cùng props → cùng UI. Không fetch, không đọc store, không `useState`(nhiều); nếu cần tương tác thì nhận callback qua props (`onClick`, `onSelect`). Ví von: như máy chiếu — cắm phiếu (props) gì thì chiếu nội dung đó, tự nó không đi lấy tin.
- **Container component** = nơi chứa "na ná controller": gọi `useQuery`/`useMutation`/store, quyết định loading/error UI, map dữ liệu thành props cho view.
- **Hooks là container hiện đại**: thay vì phải luôn tạo 2 component đúng cặp, ta thường gói logic vào custom hook (`useUser`) và gọi trong container — presentational vẫn thuần props.
- **Server Components (RSC)**: trong Next.js/RSC, *server component* là container tự nhiên (fetch trực tiếp trên server, gửi props xuống), *client component* là presentational tương tác — pattern này tái sinh dưới dạng built-in, không cần tự tổ chức.
- Phân biệt với **MVVM/hooks** (bài 3): container–presentational là phân chia component; MVVM tách ViewModel (state+logic) khỏi view qua custom hook — hai quan sát cùng một hiện tượng, khác từ khóa.

> **Tóm gọn 1 câu:** Presentational là máy chiếu thuần props, container là người gom data — và hiện đại thì container thường rút gọn thành một custom hook.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước tách một component "quá tải" thành hai vai. Đọc để có trình tự thực hành cụ thể.

1. Xác định component "quá tải": vừa fetch vừa render, props chồng chất.
2. Tách `XView` (presentational): liệt kê props thuần + callback; bỏ mọi fetch/store.
3. Tạo `XContainer`/`useX`: gọi data hook, xử lý `isPending`/`isError`, map sang props của view.
4. Đặt view gần feature hoặc vào `shared/ui` nếu dùng chung; container ở `features/`.
5. Khi chuyển sang Server Components: giữ view client (cần state), chuyển container thành server.

> **Tóm gọn 1 câu:** Nhận diện component quá tải → tách View thuần props → dựng Container/hook lo data → đặt đúng chỗ → nâng lên RSC khi cần.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

Container với data từ TanStack Query (dạng chuẩn production):
> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết trong ví dụ — những điểm nhỏ làm nên tính "thuần" của view.

- `UserCardView` — không import gì về data: đây chính là điểm "easiest to test": `<UserCardView name="A" email="b@c" selected onSelect={fn}/>` chạy được trong mọi test renderer, không cần router/query provider. Ví von: view thuần như đồ cắm điện dùng ổ 3 chân chuẩn — cắm vào ổ nào (test renderer nào) cũng chạy.
- `Omit<UserViewProps, 'selected' | 'onSelect'>` — container nhận "mọi props trừ 2 cái nó tự quản", TypeScript bảo vệ hợp đồng giữa 2 lớp.
- `aria-pressed` biến button thành toggle chuẩn cho screen reader — ví dụ presentational vẫn giữ accessibility vì nó thuộc về giao diện.
- Việc `isPending`/`isError` nằm trong container → view không bao giờ render "undefined" hay quên xử lý lỗi.

> **Tóm gọn 1 câu:** View thuần data-free là view test được ở bất kỳ đâu, và TypeScript với `Omit` là hợp đồng bảo đảm container không trọt props nào lọt.

## So sánh (nếu có)

Mục này nói về ba cặp cách tiếp cận đặt cạnh nhau để bạn chọn. Đọc để biết khi nào pattern 2 component là thừa.

- **Container–Presentational cổ điển vs Custom Hooks + View**: cổ điển tách bằng 2 component; hiện đại thường gói logic vào hook (`useUserCard`) rồi view gọi luôn — nhẹ hơn vì không phải tạo thêm component trung gian. Giữ pattern 2 component khi view phức tạp cần tách file/tái dùng.
- **Client-side separation vs Server Components**: container RSC fetch **trên server** (không gửi queryFn xuống client), presentational vẫn client khi cần state; client-only container giữ `useQuery`. Cùng ý tưởng "tách nơi lấy data khỏi nơi vẽ", nhưng RSC xóa cả chi phí fetch ở client.
- **Container–Presentational vs FSD layers (bài 1)**: pattern này là "vi phân" bên trong một slice — FSD nói *nơi* đặt, container–presentational nói *trách nhiệm trong file*.

> **Tóm gọn 1 câu:** Cùng một tư duy tách vai được hiện thực theo ba cấp: 2 component, hook + view, hay server/client — chọn cấp theo độ phức tạp thật.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về 5 bẫy khi áp pattern — đặc biệt là bẫy "tách quá mức". Đọc để không tách thành công tốn công duy trì.

- **Tách 2 file cho mọi component** → số file tăng gấp đôi chỉ để có 5 dòng render; thêm chi phí điều hướng. Fix: chỉ tách khi component vượt ~50 dòng hoặc view dùng lại nhiều nơi.
- **Presentational gọi store/hook data** → lại thành "hybrid", mất khả năng test props thuần. Fix: đẩy hook lên container; nếu thấy view cần nhiều store quá, xét dùng context/viewmodel.
- **Truyền `{...rest}` mù quáng** → props thừa rò xuống DOM, khó gỡ lỗi. Fix: liệt kê props tường minh trong type.
- **Container ôm quá nhiều nguồn dữ liệu** → container 200 dòng; "controller phình". Fix: tách container theo từng nguồn (data container + interaction container) hoặc về hook.
- **Chống chỉ định**: component thuần không có logic (chỉ layout), hoặc logic nằm trong nhiều nơi phụ thuộc nhau — tách lớp sẽ tốn công "thông minh" mà không lợi.

> **Tóm gọn 1 câu:** Tách có chừng mực: view giữ thuần props, props liệt kê tường minh, container mỏng — còn component lá 10 dòng thì đừng tách.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi ranh giới hay đắn nhất khi áp pattern — tra nhanh khi phân vân.

- **Có phải lúc nào cũng tách 2 file?** Không. Chỉ tách khi component vượt ~50 dòng, vừa fetch vừa render, hoặc view được tái dùng nhiều nơi.
- **Presentational có được dùng `useState` không?** Về nguyên tắc hạn chế; state thuần hiển thị (mở/đóng tooltip) chấp nhận được, nhưng state nghiệp vụ phải ở container.
- **Server Components thay đổi gì?** Server component là container tự nhiên (fetch trên server); client component là presentational tương tác — pattern tái sinh kiểu built-in.
- **View dùng store trực tiếp được không?** Được về mặt kỹ thuật, nhưng làm mất tính "thuần props" và khó test; hãy để container/hook cung cấp props.
- **Làm sao test container?** Test hook logic bằng `renderHook` với mock query; test UI chỉ với presentational và props giả.

## Ghi chú 2026

Mục này nói về những cập nhật mới nhất của React 19/RSC liên quan pattern — đọc để không áp cách cũ.

- Với React 19 + RSC, "container" thường là server component; chỉ phần tương tác mới đánh dấu `'use client'`.
- React Compiler giảm lo về re-render của presentational thuần props — càng khuyến khích tách view.
- Kết hợp với FSD: view đặt trong `shared/ui` hoặc `features/x/ui`, container ở `features/x`.

## Best practices / Mẹo

Mục này nói về 5 thói quen giữ pattern lành mạnh — nhỏ nhưng quyết định pattern sống hay chết trong team.

- Đặt rule: **presentational chỉ có props + return JSX**; mọi thứ khác là container/hook. Luyện mắt đọc file 5 giây biết loại.
- Đặt view trong `shared/ui` (dùng chung) hoặc trong thư mục feature; container ở `features/x/container-*`.
- Viết test UI bằng `@testing-library/react` *chỉ với presentational* (props giả) — nhanh hơn nhiều so với mock toàn bộ data layer.
- Khi dùng TanStack Query làm container: container chỉ 5–8 dòng, phần lớn sức nặng rơi vào hook `useXQuery` — giữ container mỏng.
- Cho view `displayName`/file riêng để React DevTools hiển thị rõ ràng, không lẫn lộn container/view.

> **Tóm gọn 1 câu:** View chỉ props + JSX, container mỏng dính, test view bằng props giả — đủ ba là pattern đang sống khỏe.

## Bài tập nhỏ

Mục này nói về bài thực hành tách và "co lại" — làm một lần để cảm nhận được trade-off giữa 2 component và hook.

Xây danh sách sản phẩm: `ProductCardView` (thuần props: name, price, inCart, onToggleCart) + `ProductCardContainer` (useQuery `['products', id]`, giữ state inCart local). Viết test snapshot cho view với props giả; test container có mock query. Sau đó tách hook `useProductCard(id)` và bỏ container component — so sánh: code ít hơn bao nhiêu dòng, test vẫn còn ý nghĩa?

> **Tóm gọn 1 câu:** Bài tập cho bạn tự đo được mình nên giữ 2 component hay chuyển hook — quyết định bằng số liệu, không bằng cảm tính.

## Reference

- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Passing Props (React)](https://react.dev/learn/passing-props-to-a-component)
- [Server Components](https://react.dev/reference/rsc/server-components)
