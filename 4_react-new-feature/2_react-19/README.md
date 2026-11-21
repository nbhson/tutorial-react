# React 19.0 New Features

## Mô tả
- README tổng cho version **React 19.0** (ra mắt **12/2024**, tất cả feature dưới đây **stable**) — version trọng tâm về **Actions**, **form UX**, và các API tiện dụng lấp dần những việc trước đây phải nhờ thư viện.
- Đóng vai trò **điều hướng**: liệt kê từng bài con + tóm tắt 1-2 dòng mỗi feature; mỗi folder có README chi tiết + `example.tsx`.

## Bối cảnh version

Mục này định vị React 19 trên bản đồ: 18 dựng nền concurrent, 19 xây "nhà" lên trên đó — các API tầng ứng dụng.

- Nếu React 18 mang tới **nền concurrent**, React 19 mang tới **API tầng ứng dụng** phía trên nền đó: Actions (mutation + form), `use()` (đọc promise/context), `ref`-as-prop và Document Metadata. Ví von: 18 là móng và khung sườn, 19 là khi thợ bắt đầu lắp cửa, bếp và biển hiệu nhà.
- Động lực: trước 19, form/mutation phải tự quản `onSubmit` + pending/error/result; optimistic UI phải tự rollback tay; `forwardRef` đầy boilerplate; `<head>` phải nhờ `react-helmet`/`next/head`. React 19 chuẩn hóa tất cả thành API native.
- Đây là bản **bước ngoặt cho form và data flow**, là tiền đề để hiểu React 19.2 (`<Activity>`, `useEffectEvent`) và React Server Components (Server Actions).
- 19.0 là bản major đầu tiên sau 3 năm; hầu hết app React 18 nâng lên được với vài thay đổi nhỏ (xem "Breaking changes").

## Mục tiêu
- Nắm nhóm **Actions & Form**: `action` prop, `useActionState`, `useOptimistic`, `useFormStatus`.
- Nắm nhóm **API/JSX mới**: `use()` đọc Promise/Context có điều kiện, `ref` là prop thường (bỏ `forwardRef`), Document Metadata hoist lên `<head>`.
- Biết các thay đổi phụ đáng chú ý: Context-as-provider, ref cleanup, asset preloading, custom elements.

## Vấn đề giải quyết
- Form mutation phải tự quản `onSubmit` + pending/error/result → Actions chuẩn hóa, tự set pending, hỗ trợ progressive enhancement.
- Feedback UX chậm vì chờ server → `useOptimistic` hiện ngay rồi reconcile.
- Unwrap Promise/đọc context điều kiện rườm rà → `use()`.
- `forwardRef` boilerplate, `<head>` quản tập trung → ref-as-prop và document metadata native.

## Khái niệm cốt lõi
- **Actions**: async function gắn vào `<form action>`; React quản vòng đời pending; kết hợp Server Actions (framework) để chạy cả khi chưa hydrate.
- **`useActionState` / `useFormStatus`**: một nguồn truth cho `state/isPending`; đọc pending của form từ con mà không prop drilling.
- **`useOptimistic`**: hai lớp state actual/optimistic; action throw → tự rollback.
- **`use()`**: không phải hook "top-level only"; đọc Promise (suspend, cần Suspense) hoặc Context có điều kiện.
- **ref as prop**: function component nhận `ref` bình thường; ref callback có cleanup.
- **Document Metadata**: `<title>/<meta>/<link>` hoist lên `<head>`, dedupe, `precedence` cho CSS.

> **Tóm gọn 1 câu:** React 19 là bản "trả nợ thư viện": những việc từng cần react-helmet, thủ công rollback hay forwardRef nay đều có API native.

## Điều hướng bài học

Mục này là "mục lục" 5 bài con của React 19 — đọc theo thứ tự bảng để đi từ form mutation tới metadata.

| # | Bài | Feature (1-2 dòng) |
|---|-----|--------------------|
| 1 | [Actions & useActionState](1_actions-useActionState/README.md) | `<form action={fn}>` + `useActionState` quản `state`/`isPending`; `useFormStatus` cho nút submit sâu trong form. Thay thế boilerplate `onSubmit` + `useState` pending/error. |
| 2 | [useOptimistic](2_useOptimistic/README.md) | Hiển thị state lạc quan ngay khi gửi; React thay bằng kết quả thật hoặc tự rollback khi action lỗi. UX "tức thì" mà vẫn đúng khi lỗi. |
| 3 | [use() hook](3_use-hook/README.md) | Đọc Promise/Context trong render **có điều kiện**; unwrap Promise suspend tới khi resolve (cần Suspense). Khác các hook thường ở chỗ gọi được trong `if`/vòng lặp. |
| 4 | [ref as prop](4_ref-as-prop/README.md) | Function component nhận `ref` như prop thường, bỏ `forwardRef`; ref callback có cleanup. TS gọn hơn, bớt một tầng wrapper. |
| 5 | [Document Metadata](5_document-metadata/README.md) | Render `<title>/<meta>/<link>` ngay trong component, React hoist lên `<head>` + dedupe + `precedence`. Bỏ dependency kiểu `react-helmet`. |

> **Cách đọc bảng này:** mỗi hàng là một bài con; cột "Feature" đủ dài để bạn quyết định đọc ngay hay truy vấn sau — bài 1 và 2 đi cặp (form + optimistic), bài 3–5 độc lập hơn.

## Cú pháp / API (tóm tắt)

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api-tom-tat.tsx`](examples/01-cu-phap-api-tom-tat.tsx)

## Luồng hoạt động (Flow)

Mục này phác "một lượt tương tác hoàn chỉnh" trong app 19: submit → optimistic → suspend → metadata cập nhật.

1. Submit form → React gọi action `(prevState, formData)`, tự `isPending`.
2. Optimistic update hiện ngay; khi action settle → thay bằng actual hoặc rollback.
3. Component render có thể `use(promise)` để suspend → Suspense boundary hiện fallback.
4. Metadata trong cây được hoist/dedupe lên `<head>`; SSR ghi sẵn vào HTML.

> **Tóm gọn 1 câu:** Một tương tác trong React 19 trôi qua cả 4 trạm: action xử lý, optimistic hiện sớm, Suspense chờ data, và metadata tự về head.

## So sánh với React 18 (cách làm cũ)

Bảng dưới chấm 6 "mặt trận" trước–sau. Đọc theo hàng: mỗi dòng là một việc từng cần thư viện hoặc code tay, giờ là API native.

| Khía cạnh | Trước 19 | React 19 | Lợi ích |
|---|---|---|---|
| Form | `onSubmit` + `useState` pending/error | `<form action>` + `useActionState` | Ít boilerplate, pending chuẩn |
| Optimistic UI | Tự quản + rollback tay | `useOptimistic` | Tự rollback, ít bug |
| Promise/Context | `useEffect`+state / `useContext` top-level | `use()` | Có điều kiện, bỏ boilerplate |
| Expose DOM | `forwardRef` | ref là prop | Bớt wrapper, TS gọn |
| Head metadata | `react-helmet`/`next/head` | Metadata native | Bỏ dependency |
| Provider | `<Ctx.Provider>` | `<Ctx value>` | Cú pháp gọn |

> **Cách đọc bảng này:** mỗi hàng là một khía cạnh so sánh; cột giữa là "đích đến" khuyến nghị — dùng nó để dò xem codebase của mình còn mấy chỗ theo cột "Trước 19".

## Breaking changes / Deprecations trong React 19

Mục này liệt kê những gì bị gỡ hoặc đổi khuyến nghị khi lên 19 — quan trọng nhất là phần bị gỡ hoàn toàn (render cũ, defaultProps, string ref).
- **`forwardRef` không còn cần thiết** (deprecate theo nghĩa "không khuyến khích") — `ref` là prop thường. Code cũ vẫn chạy, nhưng nên chuyển dần.
- **`ReactDOM.render`/`hydrate` bị gỡ** — phải dùng `createRoot`/`hydrateRoot` (đã deprecate từ 18). Đây là breaking lớn nhất khi nhảy từ 17.
- **`defaultProps` trên function component bị gỡ cảnh báo/không còn hỗ trợ** → dùng default parameter (destructuring) thay thế.
- **`propTypes` bị gỡ** → chuyển sang TypeScript.
- **`string` ref** (`ref="x"`) bị gỡ hoàn toàn → dùng ref callback hoặc `createRef`.
- **`ReactDOM.findDOMNode` bị gỡ** → dùng ref trực tiếp.
- **Context**: `<Ctx.Provider>` vẫn chạy nhưng `<Ctx value>` là cú pháp mới khuyến nghị.
- **Ref cleanup**: ref callback có thể trả về cleanup function (thay vì phải dùng `null` để gỡ).
- **Error handling**: lỗi không bắt (uncaught) mặc định log; hành vi thay đổi nhỏ so với 18.

## Nâng cấp từ React 18 cần lưu ý gì

Mục này là "lộ trình 8 bước" nâng cấp — bắt đầu bằng codemod dọn pattern cũ, rồi lần lượt các API mới.

1. **Chạy codemod/thay thế các pattern đã gỡ** trước khi nâng: bỏ `defaultProps`/`propTypes`/string ref/`findDOMNode`; chuyển `ReactDOM.render` → `createRoot`.
2. **`ref` là prop**: kiểm tra component expose DOM — bỏ `forwardRef` dần, nhưng nhớ **truyền `ref` xuống element** (`ref={ref}`), nếu không `current` sẽ null.
3. **`useActionState` thay `useFormState`**: `useFormState` (từ canary) đã đổi tên/gộp thành `useActionState` — cập nhật import.
4. **Server Actions cần framework**: React core chỉ cung cấp `action` phía client; muốn chạy trên server cần Next.js 15+/framework hỗ trợ.
5. **`use()` chỉ hợp lệ trong render**; không gọi trong event handler. Promise tạo trong render gây suspend vô hạn — dùng promise ổn định (module/cache/RSC).
6. **Metadata native không thay SEO framework nặng**: với yêu cầu SEO phức tạp vẫn cân nhắc framework.
7. **Nâng `@types/react`/`@types/react-dom` cùng version** để có type cho `ref`-as-prop và JSX metadata.
8. Hầu hết app 18 lên 19 chỉ cần các bước trên; lên canary/RC trước ở nhánh riêng để thử.

> **Tóm gọn 1 câu:** Chạy codemod trước, kiểm tra ref được truyền tận nơi, và nhớ đổi tên `useFormState` → `useActionState` — đó là ba việc đáng làm đầu tiên.

## Lỗi thường gặp

Mục này tóm gọn 5 lỗi "đụng trán" ngay tuần đầu với 19 — hầu hết lặp lại chi tiết từ các bài con, tốt để ôn nhanh.
1. **Quên `prevState` trong action** → formData rơi sai vị trí → fix: signature `(prev, formData)`.
2. **Throw để báo lỗi form** → React bắt ở tầng khác → fix: trả `{ ok: false, message }`.
3. **`use()` với promise tạo trong render** → suspend vô hạn → fix: promise ổn định (module/cache/RSC).
4. **Khai báo `ref` prop nhưng không truyền xuống element** → `current` null → fix: `ref={ref}` ở host node.
5. **Trùng metadata, tưởng layout thắng** → element sâu hơn thắng → fix: để page lá khai báo.

> **Tóm gọn 1 câu:** Phần lớn lỗi 19 là "quen tay 18": sai signature action, throw nhầm chỗ, promise không ổn định, ref chưa truyền tới nơi.

## Khi nào dùng / Khi nào không
- **Dùng**: mọi dự án React 19+ — Actions cho form, `useOptimistic` cho UX tức thì, `use()` cho RSC/data, metadata theo page.
- **Không**: Server Actions cần framework (Next.js) — React core chỉ cung cấp `action` phía client; metadata native không thay SEO framework nặng.

## Bài tập nhỏ

Bài tập tổng hợp cả 5 bài thành một app mini — làm trọn sẽ thấy các API 19 phối hợp với nhau nhịp nhàng thế nào.

- Dựng một "todo CRUD mini": form thêm todo dùng `useActionState` + nút submit dùng `useFormStatus`; danh sách dùng `useOptimistic` để item hiện ngay; mỗi trang đổi `<title>`/`<meta>`; input dùng `ref` prop để focus khi lỗi.

> **Tóm gọn 1 câu:** Một todo app mini đủ 4 API 19 là bằng chứng thực hành tốt hơn mọi ghi chú.

## Reference
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- [useActionState](https://react.dev/reference/react/useActionState)
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
- [use()](https://react.dev/reference/react/use)
- [ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)
- [Document Metadata](https://react.dev/blog/2024/12/05/react-19#support-for-document-metadata)

## Yêu cầu & chạy thử
- React 19+, Node.js 18+.
- `npx create-vite@latest demo -- --template react-ts && npm i react@latest react-dom@latest && npm run dev`
- Xem cả [React 18](../1_react-18/README.md) (nền tảng) và [React 19.2](../3_react-19-2/README.md) (bản nâng tiếp).
