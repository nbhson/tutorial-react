# Style Guide (React 19 + Compiler)

> Nguồn: https://react.dev/learn — https://github.com/airbnb/javascript/tree/master/react

Cùng viết một dự án mà mỗi người một kiểu đặt tên, một kiểu sắp file? Style guide chính là "nội quy vẽ chuẩn" — cả người lẫn AI đọc một quy ước duy nhất, code ra nhìn như một người viết. Mục này chốt bộ quy tắc cho React 19 + Compiler.

## Mục tiêu

Mục này nêu 3 đích của style guide. Đọc để biết sau bài này team và AI của bạn sẽ có gì.

- Có bộ quy tắc đặt tên + cấu trúc file thống nhất cho cả team và AI sinh code.
- Viết code "Compiler-safe": không mutate props/state, deps hooks đầy đủ.
- Biết nền tảng Airbnb và phần nào đã lỗi thời với React 19.

> **Tóm gọn 1 câu:** Style guide = bộ quy tắc một cho cả người và AI: đặt tên thống nhất, code Compiler-safe, và biết quy tắc cũ nào cần bỏ.

## Tổng quan

Mục này trả lời câu hỏi "vì sao cần style guide" và "React 19 đổi gì". Đọc để có động lực trước khi vào quy tắc chi tiết.

- Style guide không phải để "đẹp" mà để **nhất quán**: review nhanh, AI bắt chước đúng, ít tranh cãi.
- React 19 thay đổi vài thói quen cũ (bỏ `defaultProps`, `forwardRef` không cần, function-first).
- Áp dụng từ ngày đầu dự án; gắn với lint (bài 6/2) để tự động hóa thay vì nhắc nhở bằng mồm.

Ví von dễ nhớ: style guide giống **vạch kẻ đường** — không phải để cản xe chạy, mà để ai lái cùng chiều cũng đỡ va nhau; và lint là **camera phạt nguội**, nhắc hộ bạn thay vì phải nhắc bằng mồm mỗi PR.

> **Tóm gọn 1 câu:** Style guide tồn tại để code nhìn như một người viết — và để React 19 + Compiler chạy hết công suất, phải áp từ ngày đầu kèm lint tự động.

## Khái niệm cốt lõi

Mục này định nghĩa 7 quy tắc: function-first, cách đặt tên, xử lý props, immutability, deps hooks, thứ tự import, và bố trí file. Đọc để biết "chuẩn" trong repo này là gì trước khi sửa code.

- **Function-first**: tất cả component là function; chỉ Error Boundary cần class (vì `getDerivedStateFromError` chưa có hook tương đương).
- **Naming**: `PascalCase.tsx` cho component, `useX.ts` cho hook, `kebab-case` cho folder feature; type/interface `PascalCase` (không prefix `I`).
- **Props**: `type Props = {...}` inline; default qua destructuring, **không** `defaultProps` (bỏ từ React 19 với function component).
- **Immutability**: không sửa props/state trực tiếp (`items.push`, `user.name = ...`); tạo bản mới (`[...items, x]`) — vừa đúng React vừa để **React Compiler** memoize được.
- **Deps hooks đầy đủ**: eslint `react-hooks/exhaustive-deps` (v6) là nguồn sự thật.
- **Import order**: react → thư viện ngoài → internal (`@/`) → relative; nhóm cách nhau dấu cách.
- **File layout**: 1 component/1 file; barrel `index.ts` chỉ ở `shared/ui` (tránh lạm dụng gây phình bundle).

Nhất quán ở đây giống **cách sắp bếp**: dao ở hộc nào, chén ở kệ nào — ai vào bếp cũng lấy đúng chỗ ngay, không cần hỏi chủ nhà.

> **Tóm gọn 1 câu:** Bảy quy tắc chốt mọi thứ: function-first, tên theo chuẩn, default bằng destructuring, không mutate, deps đầy đủ, import có thứ tự, một file một component.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước để quy tắc "sống" thật trong dự án, từ chốt văn bản đến dạy AI. Làm tuần tự — bước 2 (lint) là quan trọng nhất vì máy không quên.

1. Chốt quy ước trong `CONTRIBUTING.md` / `AGENTS.md`.
2. Cấu hình lint để enforce tự động (react-hooks v6, typescript-eslint, jsx-a11y).
3. Đặt template component (snippet) để mọi người tạo đúng cấu trúc.
4. Review theo checklist ngắn; vi phạm → sửa, không tranh luận phong cách.
5. Với AI: đính kèm file mẫu chuẩn (few-shot) + `AGENTS.md`.

> **Tóm gọn 1 câu:** Chốt bằng văn bản → bắt máy enforce → phát template → review theo checklist → dạy AI theo cùng chuẩn đó.

## Ví dụ chi tiết

Mục này trỏ tới 4 file code mẫu áp đúng toàn bộ quy tắc trên. Đọc kèm file để thấy quy tắc "hiện hình" trong code thật.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

> **Tóm gọn 1 câu:** Bốn file mẫu = bốn dạng thường gặp (component, component dùng ref, hook, file type) — lấy làm khuôn để tạo file mới.

## Giải thích từng phần

Mục này bóc từng dòng trong ví dụ để bạn hiểu quy tắc vận hành thế nào. Đọc khi gặp trường hợp khớp chuẩn mà chưa rõ cớ sự.

- `tone = 'info'`: default qua destructuring — đọc ngay ở signature, khác `defaultProps`.
- `as const`: giữ literal type cho `tones`, tránh `string` chung chung.
- `ref?: React.Ref<...>` + `<button ref={ref}>`: pattern React 19 chuẩn.
- `setOn((v) => !v)`: functional update, không phụ thuộc giá trị mới, deps `[]` an toàn.
- Comment "❌ Tránh" minh họa cụ thể những gì cần loại bỏ.
- `as const` + `tones[tone]`: vừa gọn vừa type-safe, tránh chuỗi điều kiện `if/else` dài.

### Gợi ý cấu trúc thư mục

Mục này là bản đồ thư mục đề xuất cho cả app. Đọc khi khởi tạo dự án hoặc khi đang phân vân đặt file mới vào đâu.

```text
src/
  app/            # composition root: router, providers, layout
  features/       # theo domain: features/cart/ui, model, api
  shared/         # dùng chung: ui, lib, hooks, config
  pages/          # (tùy chọn) ghép feature theo route
```

> **Tóm gọn 1 câu:** Mỗi dòng ví dụ đều là một quy tắc đang "diễn" — và cây thư mục app/features/shared/pages cho biết mọi thứ nên ở đâu.

## Lỗi thường gặp / Chống chỉ định

Mục này liệt kê 5 vi phạm kinh điển với style guide React 19. Đọc để rà code của mình trước khi ai khác rà.

- **Dùng `defaultProps`/`propTypes`**: lỗi thời với function component → default trong destructuring; type do TS lo.
- **Mutate props/state** (`props.items.sort()`): không re-render + React Compiler bỏ qua component → tạo bản copy (`[...items].sort()`).
- **Hook có điều kiện / đặt tên sai**: `rules-of-hooks` báo → gọi hook vô điều kiện ở đỉnh component.
- **Prefix `I` cho interface** (`IUserProps`): lệch cộng đồng; dùng `UserProps`.
- **Barrel import khắp nơi**: phình bundle, vòng lặp import → chỉ dùng cho `shared/ui`, import trực tiếp phần khác.

Vi phạm nặng nhất là mutate props/state: như **tô màu lên bản in gốc** — bản gốc không còn nguyên, mọi lần in lại đều lỗi; luôn làm bản photo (`[...items]`) rồi chỉnh trên bản photo.

> **Tóm gọn 1 câu:** Năm vi phạm phổ biến: `defaultProps`, mutate props/state, hook có điều kiện, prefix `I`, barrel import tùy tiện — lint sẽ bắt tất cả, đừng để nó phải bắt.

## Best practices / Mẹo

Mục này gom mẹo giữ chuẩn lâu dài, kể cả khi tranh cãi xảy ra. Đọc để hệ thống quy tắc bền theo team.

- Một component/1 file, tên file khớp tên component (dễ tìm, dễ AI sinh).
- Giữ thứ tự import cố định — có thể tự động bằng ESLint `import/order`.
- Viết hook nhỏ, mỗi hook một nhiệm vụ; tên bắt đầu bằng `use`.
- Ưu tiên `type` cho props, `interface` chỉ khi cần mở rộng.
- Khi bất đồng phong cách: chạy Prettier/ESLint, không tranh luận.
- Đồng bộ với Angular-style guide (bài đối chiếu): cùng triết lý "one-file-one-thing", khác cú pháp.

> **Tóm gọn 1 câu:** Giữ chuẩn bằng máy thay vì bằng mồm: một file một component, import tự sắp, tranh cãi phong cách thì để Prettier phán.

## Bài tập nhỏ

Refactor một component lộn xộn theo chuẩn: tách type ra `export type`, thay `defaultProps` bằng destructuring, dời hook lên đỉnh, sửa `items.push` thành immutable, và đổi tên file/hook cho đúng quy ước. Chạy `eslint` xác nhận sạch.

## Reference
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [React — Describing the UI](https://react.dev/learn/describing-the-ui)
- [React 19 — ref as a prop](https://react.dev/blog/2024/12/05/react-19)
- [React Compiler rules](https://react.dev/learn/react-compiler/rules)
