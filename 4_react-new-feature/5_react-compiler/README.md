# React Compiler 1.0

Tổng hợp **React Compiler 1.0** — chính thức **stable từ 10/2025**
([react.dev/blog/2025/10/07/react-compiler-1](https://react.dev/blog/2025/10/07/react-compiler-1)).
Đây là một **build-time compiler** tự động memoize component/hook, chạy trên **cả React và React Native**, cho phép bạn bỏ dần `useMemo` / `useCallback` / `memo` thủ công cho các case phổ biến mà **không cần rewrite** code.

Hãy hình dung compiler như một trợ lý dọn nhà tự động: bạn cứ sống bình thường (viết code), trợ lý tự biết chỗ nào cần sắp gọn (memoize) — miễn là bạn không xả rác liên tục (vi phạm Rules of React).

> **Tóm gọn 1 câu:** React Compiler là "useMemo/useCallback tự động" — build-time, không cần rewrite code, đổi điều kiện là code phải sạch theo Rules of React.

## Tổng quan theo nhóm

Mục này là bản đồ của cả chương: 3 bài con xếp theo trình tự setup → hiểu cơ chế → cấu hình lint. Đọc để biết nên đi vào bài nào trước.

| # | Feature | Mô tả |
|---|---------|-------|
| 1 | [Setup Vite & Next](1_setup-vite-next/README.md) | Cài `babel-plugin-react-compiler`, cấu hình Vite / Next.js, chạy healthcheck, directive `"use memo"` / `"use no memo"` |
| 2 | [Memoization & Rules](2_memoization-rules/README.md) | Compiler memoize cái gì, cơ chế reactivity, và Rules of React bắt buộc để compile an toàn |
| 3 | [Lint Rules](3_lint-rules/README.md) | Compiler-powered lint nay nằm trong `eslint-plugin-react-hooks@6` — bắt lỗi vi phạm ngay trong IDE/CI |

> **Cách đọc bảng này:** đọc theo thứ tự số — bài 1 cài đặt, bài 2 hiểu bản chất, bài 3 bắt lỗi; mỗi dòng có link dẫn thẳng vào bài chi tiết.

## ĐÁNH GIÁ TỔNG QUAN

Mục này cho cái nhìn "mua hàng trước khi đặt": điểm mạnh, điểm cần lưu ý, và kế hoạch áp dụng vào project thật.

### Điểm mạnh

1. **Bỏ memo thủ công** — re-render không còn lan tràn vì closure/object prop mới mỗi lần render.
2. **Build-time, không runtime cost** — output vẫn là JavaScript thường; logic memo được chèn lúc build.
3. **Không cần rewrite** — hoạt động trên React DOM và React Native, giữ nguyên kiến trúc hiện có.
4. **Opt-in / opt-out linh hoạt** — `"use memo"` để bật từng phần, `"use no memo"` để tắt chỗ không an toàn.

### Điểm cần lưu ý

1. **Phải tuân thủ Rules of React** — mutate render input, hook có điều kiện, non-reactive read... sẽ khiến component bị **skip**.
2. **Skip là im lặng** — compiler bỏ qua component vi phạm mà **không vỡ build** ⇒ cần lint để biết.
3. **Không thay cache tính toán đắt** — compiler memoize theo reactivity, không phải cache kết quả tùy ý; tính toán cực nặng vẫn nên dùng `useMemo`.
4. **DevTools hiển thị `MemoizedByCompiler`** — đừng ngạc nhiên khi thấy wrapper memo trong component tree.

### Lời khuyên rollout

- **Project mới** → bật compiler từ đầu + ESLint ở mức `error`.
- **Project cũ** → chạy `npx react-compiler-healthcheck`, bật dần từng route, đo tỉ lệ component được compile.
- **Giữ memo cũ** — compiler tôn trọng `memo`/`useMemo` thủ công đúng; xóa dần sau, đừng gỡ hàng loạt.

Ví von rollout như thay động cơ trên máy bay đang bay: thay từng phần (từng route), kiểm tra định kỳ (healthcheck), đừng tháo phụ tùng cũ (memo thủ công) khi chưa chắc cái mới hoạt động ổn.

> **Tóm gọn 1 câu:** Áp dụng compiler như thăm dò mức nước: project mới bật đàng hoàng từ đầu, project cũ đo đếm rồi bật dần — đừng gỡ memo cũ hàng loạt.

## Cú pháp nhanh

Mục này gom các lệnh cài đặt và cấu hình tối thiểu để compiler chạy được — copy là dùng ngay.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-nhanh.sh`](examples/01-cu-phap-nhanh.sh)

> 📄 **Code ví dụ:** [`examples/02-cu-phap-nhanh.ts`](examples/02-cu-phap-nhanh.ts)

> 📄 **Code ví dụ:** [`examples/03-cu-phap-nhanh.tsx`](examples/03-cu-phap-nhanh.tsx)

Lint (khuyến nghị), thay cho plugin cũ `eslint-plugin-react-compiler`:

> 📄 **Code ví dụ:** [`examples/04-cu-phap-nhanh.js`](examples/04-cu-phap-nhanh.js)

## Tính năng quan trọng khác

Mục này liệt kê các công cụ và directive lẻ xung quanh compiler — những mảnh ghép nhỏ nhưng dùng dính lúc thật.

| Feature | Mô tả | Ghi chú |
|---------|-------|---------|
| `"use memo"` directive | Opt-in biên dịch cho file/component | Stable 1.0 |
| `"use no memo"` directive | Opt-out khi biết code không compile-safe | Stable 1.0 |
| `react-compiler-healthcheck` | Quét project, báo % component compile-safe | Tool CLI |
| Playground | [playground.react.dev](https://playground.react.dev) thử compile online | Tool |
| Compiler-powered lint | Rules trong `eslint-plugin-react-hooks@6` (`immutability`, `purity`, `refs`...) | Khuyến nghị |

> **Cách đọc bảng này:** mỗi dòng một công cụ, đọc cột "Mô tả" để biết nó làm gì, cột "Ghi chú" cho biết độ chín (stable/tool/khuyến nghị) — chọn dòng nào phù hợp nhu cầu hiện tại.

## Yêu cầu

Mục này là "điều kiện tham gia": môi trường và version tối thiểu để compiler chạy được.

- React 17+ (khuyến nghị React 19), Node.js 18+.
- Babel 8 / Next.js 15+ / Vite 5+.
- Code tuân thủ **Rules of React** để compiler thật sự tối ưu.

## Chạy thử

Mục này là lệnh chạy cụ thể để xác nhận compiler đã hoạt động trong project của bạn.

> 📄 **Code ví dụ:** [`examples/05-chay-thu.sh`](examples/05-chay-thu.sh)

## Tài liệu tham khảo

- [React Compiler 1.0 Release](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [Rules of React](https://react.dev/reference/rules)
- [eslint-plugin-react-hooks (compiler rules)](https://react.dev/reference/eslint-plugin-react-hooks)
