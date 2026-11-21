# 4. ref as prop

## Mô tả
- Bài này giới thiệu thay đổi lớn về refs trong React 19 (ra mắt **12/2024**, **status: stable**): **function component nhận `ref` như một prop thường** — không cần `forwardRef` nữa.
- Đi kèm: **ref callback cleanup** — `ref` callback được phép `return () => {...}` để dọn khi node detach.
- `forwardRef` vẫn chạy (compat) nhưng không còn là cách khuyến nghị; đã có **codemod** migrate tự động.

## Mục tiêu
- Bỏ `forwardRef` + `useImperativeHandle` boilerplate; viết component nhận `ref` trực tiếp.
- Nắm typing chuẩn: `ref?: React.Ref<T>` trong props.
- Dùng ref callback cleanup cho subscription/measurement gắn với DOM node.

## Vấn đề giải quyết

Mục này kể chuyện "thủ tục hành chính" tên `forwardRef` mà mọi thư viện UI từng phải gánh. Đọc để hiểu vì sao 19 xóa bỏ thủ tục đó.

- Trước 19, muốn parent đo/focus DOM của child phải:
  > 📄 **Code ví dụ:** [`examples/01-van-e-giai-quyet.tsx`](examples/01-van-e-giai-quyet.tsx)
  → boilerplate dài, TypeScript phức tạp (2 kiểu param), HOC/HOCs lồng nhau càng rối, thư viện phải expose `forwardRef` ở mọi component.
- Cũng phiền khi component không forward `ref` tiếp (chỉ dùng nội bộ): parent không thể gắn ref được; trước đây phải sửa component để thêm `forwardRef`.
- Ref callback cleanup cũ thiếu: muốn hủy subscription khi node bị tháo phải tự xử lý trong effect, không gắn được với đời sống node.

## Khái niệm cốt lõi

Mục này chốt thay đổi quan niệm: `ref` giờ chỉ là một prop thường — giống như bạn được phép viết tên người nhận trực tiếp lên kiện hàng, thay vì phải qua một đơn vị chuyển phát trung gian (`forwardRef`) như trước.

- Từ 19, `ref` là một prop **bình thường** (như `style`, `onClick`): chỉ khác là React vẫn xử lý đặc biệt khi component render DOM host node.
- Function component khai báo `{ ref }: { ref?: React.Ref<T> }` rồi **truyền tay** `ref={ref}` xuống element/kết hợp callback:
  > 📄 **Code ví dụ:** [`examples/02-khai-niem-cot-loi.tsx`](examples/02-khai-niem-cot-loi.tsx)
- **Cleaning up refs**: `ref` callback được phép trả về một hàm cleanup — React gọi khi node bị gỡ khỏi DOM hoặc ref đổi. Ví dụ dọn observer/listener.
- `useImperativeHandle` vẫn dùng khi cần **public imperative API** (ví dụ `focus()` nhưng ẩn internal DOM) — nhưng giờ kết hợp với prop `ref` thay vì `forwardRef`.
- Chú ý: `ref` không "xuyên qua" nhiều tầng tự động — mỗi component phải khai báo và truyền ref nếu muốn expose. Đây là thay đổi **hành vi mặc định**, không phải trick.

> **Tóm gọn 1 câu:** `ref` 19 là "prop công dân hạng thường" — khai báo trong props, truyền tay xuống, và callback còn được phép viết "di chúc" cleanup khi node bị tháo.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/03-cu-phap-api.tsx`](examples/03-cu-phap-api.tsx)

Codemod: `npx codemod@latest react/19/migration-recipe` để đổi `forwardRef` → prop `ref`.

## Luồng hoạt động (Flow)

Mục này theo một ref đi từ parent xuống host node rồi ngược lại lúc unmount — 4 bước cho thấy ref "tự nhiên" như prop.

1. Parent render `<MyInput ref={inputRef} />` → `ref` đi vào props như prop thường.
2. `MyInput` truyền xuống `<input ref={ref} {...props} />` → React bind ref vào host node (hoặc gọi callback).
3. Ref object: `inputRef.current = <input>`; Ref callback: được gọi với node.
4. Node bị gỡ/unmount → React gọi cleanup (nếu callback trả hàm), set `current = null`.

> **Tóm gọn 1 câu:** Ref đi vào props như mọi prop khác, bám vào host node, và rời đi kèm cleanup — không còn lớp bọc trung gian nào.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `ref?: React.Ref<HTMLInputElement>` — typing; `React.Ref<T>` là union `RefCallback<T> | RefObject<T>`.
- Callback ở `<input ref={...}>` nhận `node`; body "re-normalize": callback hay object đều được ủy quyền về `inputRef` của parent.
- `return () => console.log(...)` — **cleanup**: React gọi khi input detach; dùng để hủy listener/observer tránh leak.
- Parent gọi `inputRef.current?.focus()` — kết quả cuối cùng giống hệt `forwardRef`, nhưng không còn wrapper.

## So sánh với cách làm cũ

Bảng dưới đối chiếu `forwardRef` với prop `ref` mới. Đọc theo hàng: mỗi dòng là một chi phí của cách cũ và cách 19 xóa nó.

| Cách cũ (`forwardRef`) | Cách mới (ref prop) | Lợi ích |
|---|---|---|
| `forwardRef((props, ref) => ...)` bọc mọi component | Khai báo `ref` trong props | Ít boilerplate, dễ đọc |
| Generic 2 tham số, TS phức tạp | `React.Ref<T>` + type như props | Type-check đơn giản |
| HOC lồng nhau phải "chuyển" ref thủ công | ref là prop → tự nhiên pass qua | Tránh lỗi ref rớt |
| Cleanup ref không hỗ trợ | Ref callback `return () => ...` | Hủy subscription gắn đời sống node |

> **Cách đọc bảng này:** ba hàng đầu là về "gọn hóa" cùng một tính năng cũ, riêng hàng cuối là **tính năng mới** (cleanup) mà trước đây không có cách làm chuẩn nào.

## Lỗi thường gặp

Mục này là 5 vết trầy thường gặp khi chuyển từ `forwardRef` sang prop `ref` — nổi bật nhất là quên truyền ref xuống (số 1) và return nhầm kiểu trong callback (số 4).
1. **Khai báo `ref` trong props nhưng quên truyền xuống element** → vì sao: ref không tự "xuyên" — parent gắn nhưng child không dùng → `current` luôn null → fix: `<input ref={ref} ...>` hoặc ủy vào callback.
2. **Vẫn thói quen bọc `forwardRef`** → vì sao: chạy được nhưng thừa; một số thư viện typing cũ gây conflict → fix: migrate dần (codemod), `forwardRef` vẫn OK khi tương thích cũ.
3. **Ref callback trả về `undefined` trong khi cần cleanup** → vì sao: cleanup không chạy → leak listener → fix: `return () => {...}`.
4. **Ref callback có nhánh return nhiều kiểu (`undefined` / function) sai chỗ** → vì sao: React dùng return value làm cleanup; return nhầm `node` (truthy) → "cleanup = node" lỗi → fix: chỉ return `undefined` hoặc hàm cleanup.
5. **Set `ref` trong render object theo mỗi render mới** → vì sao: ref mới mỗi lần → detach/attach liên tục → fix: `useRef` ổn định hoặc callback có cleanup.

> **Tóm gọn 1 câu:** Ref phải được "chuyển tay tận nơi" — khai báo trong props, truyền xuống element, và cleanup chỉ nhận đúng hàm chứ không nhận thứ gì khác.

## Khi nào dùng / Khi nào không
- **Dùng**: mọi component cần expose DOM (input, dialog, custom button, canvas), library đang có `forwardRef` (migrate dần), cleanup gắn node (observer, resize listener).
- **Không dùng**: ref cho thứ không có DOM host (Server Component — không có ref), hoặc lạm dụng ref để trigger state (dùng `useState`/`useEffect` đúng chỗ). `forwardRef` chỉ giữ cho tương thích cũ.

## Bài tập nhỏ

Bài tập ghép prop `ref` với `useImperativeHandle` — combo phổ biến nhất khi expose API imperative có kiểm soát.

- Viết `Dialog` nhận `ref` để parent gọi `dialogRef.current.showModal()` (dùng `<dialog>`). Triển khai bằng prop `ref` + `useImperativeHandle` (expose `showModal`/`close`). Sau đó thêm ref callback cleanup ghi log khi `<dialog>` unmount — kiểm tra log chạy đúng một lần.

> **Tóm gọn 1 câu:** `showModal()` chạy được từ parent và log unmount hiện đúng một lần — nghĩa là bạn đã kết nối đúng cả hai chiều của ref.

## Reference
- [React 19 Release — ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)
- [forwardRef (legacy)](https://react.dev/reference/react/forwardRef)
- [useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)
- [Ref callback cleanup](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)