# 1. Setup React Compiler (Vite & Next.js)

## Mô tả

React Compiler 1.0 đạt **stable từ 10/2025** (release chính thức `react.dev/blog/2025/10/07/react-compiler-1`). Đây là một **build-time compiler**: nó phân tích code React của bạn lúc build rồi tự động chèn memoization, giống như thể bạn đã viết `useMemo` / `useCallback` / `memo` bằng tay — nhưng chính xác và toàn diện hơn.

Compiler hoạt động trên **cả React DOM và React Native**, không cần rewrite component. Bạn giữ nguyên cách viết code hiện tại, chỉ cần cấu hình build tool để chạy compiler.

## Mục tiêu

- Hiểu React Compiler là gì và vì sao nó là build-time (không runtime cost).
- Cấu hình được compiler cho **Vite** (qua `@vitejs/plugin-react` + Babel) và **Next.js** (qua flag `reactCompiler`).
- Biết cách kiểm tra độ tương thích codebase bằng `react-compiler-healthcheck`.

## Vấn đề giải quyết

Mục này kể lý do React Compiler tồn tại: memoization thủ công là "ba cái bẫy cùng lúc" — thiếu, thừa, hay sai ngầm. Đọc để hiểu compiler đổi trò chơi thế nào.

Trước React Compiler, để tránh re-render thừa bạn phải bọc `memo()`, `useMemo()`, `useCallback()` bằng tay:

- Dễ **thiếu** — quên memo một callback truyền xuống child nặng ⇒ child re-render vô ích.
- Dễ **thừa** — memo mọi thứ ⇒ code rối, dependency array khó bảo trì.
- **Sai ngầm** — dependency array sai thứ tự ⇒ stale value, bug khó tìm.

Ví von: như tự tay cân từng nguyên liệu cho mỗi món ăn —Compiler là chiếc cân điện tử cài sẵn công thức: cân đúng, cân đủ, và cân cả những chỗ bạn quên.

Compiler thay thế công việc thủ công đó: nó đọc toàn bộ component, dựng đồ thị phụ thuộc, và chỉ chèn memo khi thật sự có lợi. Điều kiện là code phải tuân thủ **Rules of React** — nếu không, component đó bị **skip** (compiler bỏ qua, không vỡ build).

## Khái niệm cốt lõi

Mục này trả lời "compiler chạy ở đâu, làm gì": không phải runtime, không phải phép màu — là một bước transform lúc build. Hãy hình dung nó như trình kiểm tra chính tả chuyên sâu: chạy trước khi in (build), sửa giúp (chèn memo), nhưng gặp đoạn "vi phạm ngữ pháp" (Rules of React) thì bỏ qua đoạn đó chứ không từ chối in cả tài liệu.

Compiler không chạy trong browser. Nó là một bước transform (Babel plugin hoặc SWC plugin) chèn helper runtime nhỏ vào output. Vài điểm quan trọng:

- **Không runtime cost** — output vẫn là JavaScript thường; logic memo nằm ở dữ liệu chèn lúc build.
- **Tự động theo reactivity** — compiler memo dựa trên giá trị nào *thực sự* thay đổi, chứ không chỉ so sánh reference thô.
- **Opt-in / opt-out bằng directive**:
  - `"use memo"` — bật compile cho một file/component cụ thể (khi bạn chưa bật toàn cục).
  - `"use no memo"` — tắt compile cho file/component (khi biết code không compile-safe, ví dụ interop với thư viện mutable).
- **Skip thay vì crash** — component vi phạm rules bị compiler bỏ qua lặng lẽ. Vì vậy cần ESLint để phát hiện (xem bài 3).

> **Tóm gọn 1 câu:** React Compiler là "thợ memo tự động" làm việc lúc build — đúng chỗ cần, lặng lẽ bỏ qua chỗ code vi phạm rules, và không tốn thêm gì lúc chạy.

## Cú pháp / API

### Bước 1 — Cài đặt và kiểm tra

> 📄 **Code ví dụ:** [`examples/01-buoc-1-cai-at-va-kiem-tra.sh`](examples/01-buoc-1-cai-at-va-kiem-tra.sh)

`react-compiler-healthcheck` quét project, báo số component compile-safe / bị skip và lý do — chạy trước khi bật compiler cho codebase cũ.

### Bước 2a — Vite (Vite 8 / rolldown)

> **⚠️ Cập nhật Vite 8 (03/2026):** Vite 8 dùng **Rolldown** (bundler Rust) thay cho Rollup + esbuild — `rolldown-vite` giờ là core của Vite 8. Kèm đó, **`@vitejs/plugin-react` v6+ đã bỏ option `babel`**, nên config kiểu cũ `react({ babel: { plugins: ['babel-plugin-react-compiler'] } })` **không còn hoạt động**. Có 2 cách cấu hình compiler trên Vite 8:

**Cách 1 — Native compiler qua Oxc (khuyến nghị, experimental):** `@vitejs/plugin-react` ≥ 6.1 có option `compiler` dùng `oxc-transform-react` (port Rust của React Compiler):

> 📄 **Code ví dụ:** [`examples/02-buoc-2a-vite-vite-8-rolldown.sh`](examples/02-buoc-2a-vite-vite-8-rolldown.sh)

> 📄 **Code ví dụ:** [`examples/03-buoc-2a-vite-vite-8-rolldown.ts`](examples/03-buoc-2a-vite-vite-8-rolldown.ts)

**Cách 2 — Babel qua `@rolldown/plugin-babel` + `reactCompilerPreset`** (ổn định, dùng khi cần option Babel đầy đủ):

> 📄 **Code ví dụ:** [`examples/04-buoc-2a-vite-vite-8-rolldown.sh`](examples/04-buoc-2a-vite-vite-8-rolldown.sh)

> 📄 **Code ví dụ:** [`examples/05-buoc-2a-vite-vite-8-rolldown.ts`](examples/05-buoc-2a-vite-vite-8-rolldown.ts)

> **Vite 7 trở xuống (legacy):** vẫn dùng cách cũ — `react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } })` với `@vitejs/plugin-react` v5. Hoặc chuyển dần qua gói `rolldown-vite` trên Vite 7 trước khi lên Vite 8 (đường migration 2 bước mà team Vite khuyến nghị).

### Bước 2b — Next.js

> 📄 **Code ví dụ:** [`examples/06-buoc-2b-next-js.ts`](examples/06-buoc-2b-next-js.ts)

### Directive trong code

> 📄 **Code ví dụ:** [`examples/07-directive-trong-code.tsx`](examples/07-directive-trong-code.tsx)

## Luồng hoạt động (Flow)

Mục này là "trình tự lắp đặt" 7 bước — từ cài package tới thêm ESLint để thấy component nào bị skip ngay trong IDE.

1. **Cài** `babel-plugin-react-compiler` và chạy `react-compiler-healthcheck`.
2. **Cấu hình build tool**: Vite (Babel plugin) hoặc Next.js (`reactCompiler: true`).
3. Ở mỗi lần build, compiler đọc từng component/hook.
4. Compiler kiểm tra code có tuân thủ **Rules of React** không (pure render, không mutate input...).
5. **Hợp lệ** → chèn memoization tự động vào output.
6. **Vi phạm** → bỏ qua (skip) component đó, phần còn lại vẫn build bình thường.
7. Bạn thêm ESLint (bài 3) để phát hiện các component bị skip ngay trong IDE.

> **Tóm gọn 1 câu:** Cài → cấu hình → compiler tự duyệt từng component lúc build: hợp lệ thì chèn memo, vi phạm thì skip — bạn chỉ cần "gác cổng" bằng ESLint.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx) cùng thư mục. Dưới đây là bản diễn giải đầy đủ, comment từng dòng:

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`'use memo'`** — directive bật compiler cục bộ. Trong project đã bật toàn cục (Vite/Next config) thì directive này không bắt buộc, nhưng hữu ích khi bạn muốn opt-in từng file trong giai đoạn rollout.
- **`ExpensiveChild` và `config={{ theme }}`** — minh họa điểm mạnh cốt lõi: object literal mới mỗi render trông như "gây re-render", nhưng compiler theo dõi *giá trị* bên trong. Chỉ khi `theme` đổi thì child mới render lại.
- **`console.log`** — dùng để *chứng minh* hành vi: bấm "Tick" nhiều lần, bạn sẽ thấy child không in log thêm.
- **`ManualMemoChild = memo(...)`** — cho thấy compiler **không phá** code memo cũ. Nó nhận ra component đã được memo và để yên.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tự viết `useMemo`/`useCallback` cho từng giá trị | Compiler tự chèn memo khi cần | Ít code, không lo thiếu/thừa |
| Phải nhớ bọc `memo()` cho child nặng | Compiler tự quyết định memo child | Không bỏ sót node nóng |
| Dependency array sai ⇒ stale value | Compiler suy ra phụ thuộc từ code | Loại bỏ lớp bug phổ biến |
| Memo "bằng cảm giác"/đoán | Memo dựa trên phân tích thật của compiler | Chính xác, đều tay trên toàn codebase |

> **Cách đọc bảng này:** mỗi hàng là một việc từng làm tay; hàng thứ ba đáng chú ý nhất — cả một lớp bug "stale value do deps sai" biến mất, không phải được vá.

## Lỗi thường gặp

Mục này là 5 lỗi setup phổ biến — riêng lỗi 1 và 3 liên quan trực tiếp tới thay đổi Vite 8 nêu ở Bước 2a.

1. **Quên cài `babel-plugin-react-compiler`** — đặt config nhưng thiếu package ⇒ build lỗi hoặc compiler không chạy.
   *Fix:* `npm i -D babel-plugin-react-compiler` rồi build lại. (Vite 8 + plugin-react v6: kiểm tra bạn đang dùng đúng 1 trong 2 cách ở Bước 2a — `react({ compiler: true })` hoặc `@rolldown/plugin-babel`; option `react({ babel: ... })` đã bị bỏ ở plugin v6.)
2. **Đặt `reactCompiler: true` sai chỗ theo phiên bản Next** — Next 15 cần `experimental.reactCompiler`, Next 16 dùng top-level. *Fix:* xem phiên bản Next, đặt đúng vị trí.
3. **Bật compiler cho codebase cũ chưa kiểm tra** — nhiều component bị skip mà bạn không biết. *Fix:* chạy `npx react-compiler-healthcheck` trước, xử lý vi phạm dần.
4. **Tưởng bật compiler là mọi thứ tự tối ưu** — nếu component vi phạm Rules of React, nó bị skip. *Fix:* dùng ESLint (bài 3) để đảm bảo thực sự được compile.
5. **Nhầm `"use memo"` là state/effect hook** — nó chỉ là directive điều khiển compiler, không có runtime behavior. *Fix:* chỉ đặt ở dòng đầu file/function.

> **Tóm gọn 1 câu:** Healthcheck trước, cấu hình đúng phiên bản (Vite 8 khác Vite 7, Next 15 khác 16), và đừng tin "bật là xong" — ESLint mới là bằng chứng component nào được compile thật.

## Khi nào dùng / Khi nào không

**Nên dùng khi:**
- Project mới (React 17+, khuyến nghị React 19) — bật compiler ngay từ đầu.
- Codebase cũ — chạy healthcheck, bật dần từng route, đo tỉ lệ component được compile.
- Bạn muốn giảm code memo thủ công mà không đổi kiến trúc.

**Cân nhắc khi:**
- Có nhiều đoạn interop với thư viện mutable ngoài (đọc/ghi object ngoài React) — có thể bị skip; dùng `"use no memo"` + comment lý do.
- Có tính toán cực nặng theo kiểu "cache kết quả" — compiler memoize *reactivity* chứ không thay cache tính toán; vẫn giữ `useMemo` cho case này (xem bài 2).

## Bài tập nhỏ

Bài tập chứng minh "memo không cần viết tay" bằng console.log — cách kiểm chứng trực quan nhất cho người mới.

Tạo một Vite project, cấu hình `babel-plugin-react-compiler`, rồi viết một `Parent` truyền `style={{ color }}` và một callback inline xuống `Child` có `console.log`. Bấm một nút chỉ đổi state *không* liên quan và kiểm chứng: `Child` **không** in log thêm nhờ compiler.

> **Tóm gọn 1 câu:** Child im lặng khi bấm nút không liên quan — dấu hiệu compiler đang làm đúng việc của nó.

## Reference

- [React Compiler 1.0 Release (react.dev blog)](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler — Installation & Setup](https://react.dev/learn/react-compiler)
- [babel-plugin-react-compiler (npm)](https://www.npmjs.com/package/babel-plugin-react-compiler)
- [Next.js — React Compiler config](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler)
