# 3. ESLint Rules cho React Compiler

## Mô tả

React Compiler 1.0 (**stable 10/2025**) **skip** (bỏ qua) component vi phạm Rules of React mà **không làm vỡ build**. Điều này tiện nhưng nguy hiểm: bạn tưởng code đã được tối ưu, thực tế compiler đã bỏ qua nó — giống như cóng an toàn vẫn đội nhưng quên chốt quai, tai nạn tới đâu không ai báo trước.

Các **compiler-powered lint rules** nay được ship trong **`eslint-plugin-react-hooks` v6** (preset `recommended` / `recommended-latest`). Plugin cũ **`eslint-plugin-react-compiler`** đang được **migrate sang `eslint-plugin-react-hooks`**; cả hai vẫn tồn tại, nhưng khuyến nghị dùng `eslint-plugin-react-hooks@6`.

> **Tóm gọn 1 câu:** Compiler skip lặng lẽ nên cần lint "hét lên" — bài này cấu hình ESLint để phát hiện ngay component nào không được tối ưu.

## Mục tiêu

- Cấu hình ESLint để phát hiện code không compile-safe **ngay trong IDE/CI**.
- Nhận diện các lỗi phổ biến: mutate prop, hook có điều kiện, non-reactive read.
- Phân biệt plugin mới (`eslint-plugin-react-hooks@6`) và plugin cũ (`eslint-plugin-react-compiler`).

## Vấn đề giải quyết

Mục này nói về "điểm mù" của compiler: nó bỏ qua code vi phạm mà không báo lỗi build — vậy làm sao biết được? Đọc để hiểu vì sao cần một lớp kiểm tra tĩnh.

Vì compiler **skip lặng lẽ** khi gặp code vi phạm, nếu chỉ dựa vào việc "build thành công" bạn sẽ không biết mình đang *không* được tối ưu. Cần một lớp kiểm tra tĩnh:

- Bắt lỗi khi **đang viết** code (gạch đỏ trong IDE), không đợi build.
- Chặn ở **CI/pre-commit** để không lọt code skip-compiler vào repo.
- Đưa ra **gợi ý sửa** cụ thể cho từng vi phạm Rules of React.

> **Tóm gọn 1 câu:** Build xanh không có nghĩa là được tối ưu — lint chính là "camera hành trình" ghi lại từng lần compiler skip.

## Khái niệm cốt lõi

Mục này giải thích tại sao lint ở đây khác lint thông thường: nó mượn chính "bộ não" của compiler để soi code. Đọc để hiểu vì sao lint báo đúng những gì compiler sẽ skip.

Các rule này không phải rule style thông thường — chúng dùng chính logic phân tích của compiler. Ví von: lint là "cặp sinh đôi" của compiler, cùng nhìn code bằng một cặp mắt nên thứ gì compiler từ chối thì lint bắt được y hệt. Nghĩa là: **thứ gì compiler sẽ skip, lint sẽ báo**. Nhờ vậy lint là "cửa ngõ" đảm bảo tối ưu thực sự diễn ra.

Hai plugin:

- **`eslint-plugin-react-hooks` v6** — khuyến nghị; preset `recommended` / `recommended-latest` chứa rule compiler-powered.
- **`eslint-plugin-react-compiler`** — đang migrate; rule `react-compiler/react-compiler`, sẽ chuyển dần sang plugin hooks.

Một số cảnh báo điển hình:

- `Mutating a value returned from a function` / "do not mutate props".
- `React Hook called conditionally` / `React Hook "useState" is called in a callback`.
- "Non-reactive read" — đọc `ref.current` hoặc biến ngoài trong render.

> **Tóm gọn 1 câu:** Compiler-powered lint = mượn bộ não compiler để soi code, báo đúng chỗ nào sẽ bị skip.

## Cú pháp / API

Mục này là phần "tay nghề": cài đặt và cấu hình ESLint từng bước, từ preset có sẵn đến bật từng rule riêng lẻ.

### Cài đặt

> 📄 **Code ví dụ:** [`examples/01-cai-at.sh`](examples/01-cai-at.sh)

### Cấu hình khuyến nghị (flat config) — `eslint-plugin-react-hooks@6+`

Cách gọn nhất là dùng preset có sẵn. `recommended` bật bộ rule ổn định;
`recommended-latest` bật thêm các rule compiler còn mới:

> 📄 **Code ví dụ:** [`examples/02-cau-hinh-khuyen-nghi-flat-config-eslint-plugin.js`](examples/02-cau-hinh-khuyen-nghi-flat-config-eslint-plugin.js)

Hoặc bật từng rule compiler cụ thể:

> 📄 **Code ví dụ:** [`examples/03-cau-hinh-khuyen-nghi-flat-config-eslint-plugin.js`](examples/03-cau-hinh-khuyen-nghi-flat-config-eslint-plugin.js)

### Cấu hình plugin cũ (đang migrate)

> 📄 **Code ví dụ:** [`examples/04-cau-hinh-plugin-cu-ang-migrate.js`](examples/04-cau-hinh-plugin-cu-ang-migrate.js)

Chạy: `npx eslint .`. Lưu ý: các rule compiler trong `eslint-plugin-react-hooks` có tên riêng
(`react-hooks/immutability`, `react-hooks/purity`, `react-hooks/refs`,
`react-hooks/static-components`...), không phải một rule `react-compiler` duy nhất.

## Luồng hoạt động (Flow)

Mục này mô tả vòng đời của một vi phạm: từ lúc cài plugin, đến lúc gạch đỏ trong IDE, đến lúc sửa xong được compiler tối ưu.

1. Cài `eslint-plugin-react-hooks@6` (khuyến nghị) và/hoặc `eslint-plugin-react-compiler`.
2. Thêm plugin + bật rule ở mức `error` trong `eslint.config.js`.
3. ESLint phân tích từng file bằng logic tương tự compiler.
4. Vi phạm Rules of React ⇒ báo lỗi kèm gợi ý sửa.
5. Chạy trong IDE (gạch đỏ tức thì) và trong CI/pre-commit.
6. Sửa lỗi ⇒ component được compiler tối ưu thật sự.

Hãy hình dung như quy trình khám sức khỏe: cài "máy đo" (plugin), chạy xét nghiệm (eslint .), phát hiện chỉ số bất thường (vi phạm), điều trị (sửa code) — và bác sĩ thông báo "khỏi" chính là compiler chịu tối ưu.

> **Tóm gọn 1 câu:** Cài plugin → bật rule mức error → lint soi bằng logic compiler → sửa → compiler tối ưu thật sự.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Ba pattern lint sẽ bắt, kèm cách sửa:

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này mổ xẻ từng component trong file ví dụ — cái nào lint "bắt", vì sao, và sửa ra sao.

- **`BadMutate` — `tags.sort()`** — `.sort()` sửa mảng tại chỗ, tức mutate props. Lint báo "do not mutate". Sửa bằng `[...tags].sort()` để sort trên bản sao.
- **`BadHook`** — đặt `useState` bên trong `if` phá vỡ thứ tự hook cố định giữa các lần render. Lint báo "hook called conditionally". Sửa: kéo hook lên top-level.
- **`BadRefRead`** — đọc `ref.current` trong render là non-reactive read: giá trị này đổi mà không trigger render. Lint cảnh báo. Sửa: đọc ref trong handler/effect, dùng state cho giá trị hiển thị.
- **`Good`** — gộp mọi cách sửa: copy trước khi sort, hook top-level, không đọc ref trong render. Lint pass ⇒ compiler chắc chắn tối ưu.

## So sánh với cách làm cũ

Mục này cho thấy đời trước khi có compiler-powered lint khổ thế nào và bây giờ tiện thế nào — từng cột là một bước tiến cụ thể.

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Chỉ biết component bị skip khi đọc log build | Lint báo ngay trong IDE | Phát hiện sớm, sửa tức thì |
| `eslint-plugin-react-compiler` riêng lẻ | `eslint-plugin-react-hooks@6` gộp compiler rules | Một plugin, đồng bộ với rules-of-hooks |
| Dựa vào trí nhớ về Rules of React | Rule tự động dùng logic compiler | Không bỏ sót vi phạm |
| Không có tầng chặn ở CI | Rule `error` + CI/pre-commit | Không lọt code skip-compiler |

> **Cách đọc bảng này:** mỗi hàng là một "nỗi đau" cũ ở cột trái, cách giải quyết mới ở cột giữa, và phần thưởng nhận được ở cột phải — đọc trái sang phải để thấy sự chuyển đổi.

## Lỗi thường gặp

Mục này là "bệnh án" 5 lỗi cấu hình/dùng lint hay gặp nhất, mỗi lỗi đều có đơn thuốc *Fix* ngay bên cạnh.

1. **Cài plugin nhưng quên bật rule** ⇒ không có cảnh báo nào. *Fix:* thêm rule vào `rules` và đặt `'error'`.
2. **Tưởng phải cài React Compiler mới lint được** ⇒ bỏ qua lint vì chưa bật compiler. *Fix:* theo blog 1.0, `eslint-plugin-react-hooks` **không cần** cài compiler vẫn chạy — cứ bật lint ngay để soi Rules of React.
3. **Đặt `warn` rồi bỏ qua** suốt thời gian dài ⇒ code skip-compiler tích tụ. *Fix:* code mới để `error`, code cũ `warn` rồi nâng dần.
4. **Disable rule không lý do** (`// eslint-disable-next-line`) ⇒ che mất vấn đề. *Fix:* nếu là interop thư viện mutable, dùng `"use no memo"` + comment giải thích.
5. **Quên chạy lint ở CI** ⇒ chỉ dev có IDE mới thấy. *Fix:* thêm `eslint .` vào pipeline và pre-commit hook.

## Khi nào dùng / Khi nào không

Mục này chia code thành hai nhóm — code mới bật `error` ngay, code cũ nâng dần từ `warn` — cùng vài ngoại lệ đáng cân nhắc.

**Nên dùng:**
- **Code mới**: bật ở mức `error` — đảm bảo mọi component mới đều compile-safe.
- **Code cũ**: bắt đầu `warn`, đo số vi phạm, sửa dần rồi nâng lên `error`.
- **CI/pre-commit**: bắt buộc, để không lọt code skip-compiler.

**Cân nhắc:**
- File interop thư viện mutable thật sự không sửa được ⇒ dùng `"use no memo"` + disable rule **cục bộ kèm comment lý do**, đừng disable toàn repo.
- Với plugin cũ `eslint-plugin-react-compiler`, hãy lên kế hoạch migrate sang `eslint-plugin-react-hooks@6`.

## Bài tập nhỏ

Cấu hình ESLint với `eslint-plugin-react-hooks@6` ở `error`, rồi cố tình viết ba component vi phạm (mutate prop, hook trong `if`, đọc `ref.current` trong render). Quan sát thông báo lint, sửa từng cái cho tới khi sạch, và ghi lại tên rule tương ứng mỗi vi phạm.

> **Tóm gọn 1 câu:** Lint compiler-powered là "hàng rào điện" trước cửa nhà compiler: chạm vào vi phạm là bị sốc ngay trong IDE, không đợi build mới biết.

## Reference

- [eslint-plugin-react-hooks (npm)](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [eslint-plugin-react-compiler (npm, đang migrate)](https://www.npmjs.com/package/eslint-plugin-react-compiler)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [Rules of React](https://react.dev/reference/rules)
