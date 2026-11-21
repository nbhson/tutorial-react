# 3. Unit Test — Vitest + React Testing Library

> Đối chiếu `3_unit-test` của AngularJS (Karma + Jasmine + **bower** — đã lỗi thời).
> Ở đây dùng **npm hiện đại**: `vitest` + `@testing-library/react` + `jsdom`. Test vẫn chạy được class components (legacy) bình thường.
> Hiện nay nên test function components + hooks, nhưng cú pháp test giống hệt.

## Mục tiêu bài học
- Dựng bộ test cho class component legacy bằng Vitest + React Testing Library (không cần Karma/Jasmine/bower của AngularJS).
- Viết test theo góc nhìn **người dùng**: render component, tương tác bằng `fireEvent`, kiểm tra bằng `screen`.
- Dịch matcher quen thuộc của Jasmine sang `expect` của Vitest.

## Khái niệm cốt lõi (Core)

Mục này giới thiệu bộ công cụ test hiện đại thay Karma/Jasmine và triết lý "test như người dùng" của RTL. Đọc để hiểu bộ ba Vitest + jsdom + RTL hoạt động cùng nhau ra sao.

- AngularJS test: Karma chạy trình duyệt thật + Jasmine `describe/it/expect` + compile template HTML rồi thao tác DOM. Cồng kềnh, phụ thuộc bower.
- React hiện đại: **Vitest** (runner, chạy trên Node) + **jsdom** (giả lập DOM trong Node) + **React Testing Library (RTL)** — render component trong môi trường giả lập rồi tương tác như người dùng.
- RTL triết lý: test **hành vi người dùng thấy** (text, button, role) thay vì state nội bộ hay instance — giống cách test AngularJS qua DOM/template đã biên dịch.
  - `render(<Counter />)` — dựng component.
  - `screen.getByRole("button", { name: /tăng/i })` — tìm nút theo role + text (cách "người dùng" tìm).
  - `fireEvent.click(...)` — mô phỏng bấm.
  - `expect(...).toHaveTextContent("1")` — kiểm tra UI output.
- Matcher map Jasmine → Vitest: cùng tên `toBe`, `toEqual`, `toContain`, `toMatch`, `toBeTruthy/Falsy/Null/Defined`; `toBeCloseTo` xử lý số thực.
- `@testing-library/jest-dom` cung cấp matcher DOM (như `toHaveTextContent`, `toBeInTheDocument`) qua setup file.

Ví von: nếu Karma là xây cả sân vận động (trình duyệt thật) để tập đá bóng thì Vitest + jsdom là sân cỏ mini trong nhà — nhẹ, nhanh, đủ dùng; RTL thì bắt bạn đá theo đúng "tư thế người chơi" (nhìn nút, bấm nút) chứ không được móc vào máy móc bên trong.

> **Tóm gọn 1 câu:** Vitest + jsdom + RTL = bộ ba thay Karma/Jasmine: chạy nhanh trong Node, test theo góc nhìn người dùng, cú pháp `expect` gần như giữ nguyên.

### Keyword chính
`vitest` · `jsdom` · `@testing-library/react` · `render` · `screen` · `fireEvent` · `toBeCloseTo` · `describe/it/expect`.

## Luồng hoạt động (Flow)

Mục này lần theo một lần chạy `npm test` từ lúc Vitest đọc config đến khi từng test pass/fail.

1. Chạy `npm install` (cài vitest, RTL, jsdom, jest-dom).
2. `npm test` → Vitest đọc config `vitest.config.js` (`environment: "jsdom"`, `setupFiles: ["./vitest.setup.js"]` mang matcher jest-dom vào).
3. Vitest chạy `src/__tests__/*.test.jsx`:
   - Test 1: `render(<Counter initial={5} />)` → `screen.getByTestId("count")` → `toHaveTextContent("5")`.
   - Test 2: `render(<Counter />)` → `fireEvent.click(screen.getByRole("button", {name:/tăng/i}))` → count thành "1".
   - Test 3-4 (functional): `formatVND(1250000)` chứa "₫"; `0.1 + 0.2` `toBeCloseTo(0.3)`.
4. Vitest báo pass/fail theo từng test — tương đương Karma+Jasmine report.

## Ví dụ chi tiết (test)
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet-test.jsx`](examples/01-vi-du-chi-tiet-test.jsx)

Component được test (class legacy):
> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet-test.jsx`](examples/02-vi-du-chi-tiet-test.jsx)

## Giải thích từng phần
- **`render(<Counter initial={5} />)`**: RTL dựng component vào DOM giả lập (jsdom). Props truyền như thật — đúng cách test "component chạy như production".
- **`screen.getByTestId("count")`**: `data-testid` là "móc" để tìm phần tử khi không tiện dùng role/text (chấp nhận được cho vùng hiển thị ổn định).
- **`screen.getByRole("button", { name: /tăng/i })`**: tìm theo ARIA role + tên truy cập (text của nút) — giống người dùng thực nhìn. Regex `/tăng/i` chống lệch hoa thường.
- **`fireEvent.click(...)`**: đồng bộ (không async) — sau click, `setState` chạy, RTL bọc re-render, ngay dòng sau kiểm tra `toHaveTextContent("1")` là hợp lệ.
- **`toBeCloseTo`**: `0.1 + 0.2` thực chất là `0.30000000000000004` — so bằng `toBe` sẽ fail; `toBeCloseTo(0.3)` chấp nhận sai số — đúng cách test float (cũng là tương đồng Jasmine).
- **`describe/test/expect`**: cú pháp gần như Jasmine (`describe/it/expect`) — dịch code test cũ sang nhanh.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này dịch từng khâu của bộ test Karma/Jasmine sang Vitest/RTL — từ cách dựng component đến từng matcher.

| AngularJS (Karma+Jasmine) | React (Vitest+RTL) | Ghi chú |
|---|---|---|
| Karma chạy browser thật | jsdom giả lập DOM trong Node | Nhanh hơn, không cần browser |
| `describe/it/expect` (Jasmine) | `describe/test/expect` (Vitest) | Syntax gần như giống hệt |
| `$compile(template)` + `$scope` | `render(<Comp />)` | Cùng "dựng component lên" |
| `element.find(...)` thao tác DOM | `screen.getByRole/ByText` + `fireEvent` | RTL theo góc nhìn người dùng |
| `toBe`/`toEqual`/`toContain` | `toBe`/`toEqual`/`toContain` | Cùng tên, cùng ý nghĩa |
| `toBeCloseTo` | `toBeCloseTo` | Số thực |
| bower (lỗi thời) | npm | Hệ sinh thái hiện đại |

> **Cách đọc bảng này:** các dòng xếp từ hạ tầng (browser vs jsdom, bower vs npm) xuống chi tiết cú pháp (matcher); dòng 4 là khác biệt triết lý lớn nhất — RTL tìm phần tử như người dùng nhìn, không như code thao tác DOM.

> **Tóm gọn 1 câu:** Mọi thứ quen thuộc của Jasmine gần như "xịt chuyển" sang Vitest nguyên tên — thay chỉ ở hạ tầng chạy và cách tìm phần tử theo vai trò người dùng.

## Lỗi thường gặp (Common pitfalls)

Lỗi test phần nhiều là "test sai đối tượng" (cài đặt bên trong) hoặc "quên await" — mục này gom cả hai.

- **Test instance/state nội bộ** (VD gọi `wrapper.state()` như Enzyme/Jasmine thuần) → test bám vào implementation, đổi code là vỡ. → Test qua UI: text, button, behavior.
- **Quên `screen` import** hoặc dùng `getByTestId` trên phần tử undefined → ReferenceError. → Import đủ từ `@testing-library/react`; nếu không tìm thấy, kiểm tra component render đúng chưa.
- **Dùng `toBe` cho số thực** → fail vì floating point. → Dùng `toBeCloseTo`.
- **Test async (fetch/chờ re-render) dùng `fireEvent` mà không await** → đọc trạng thái cũ. → Với thao tác bất đồng bộ dùng `await screen.findBy...` hoặc `waitFor`.
- **Không cài jest-dom matcher** → `toHaveTextContent` báo không tồn tại. → Đảm bảo `setupFiles` nạp `@testing-library/jest-dom`.

> **Tóm gọn 1 câu:** Test vỡ khi refactor là dấu hiệu test sai đối tượng — hãy bám vào thứ người dùng thấy (text, role, hành vi) thay vì cấu trúc bên trong.

## Best practices / Mẹo
- "Test như người dùng": tìm bằng role + text, không bằng class/id (trừ `data-testid` khi bất khả kháng).
- Một test một hành vi — đọc như tài liệu: "render → action → assert".
- Test cả hàm thuần helper (`formatVND`) tách biệt — nhanh, không cần render (giống test filter của AngularJS).
- Chạy `npm run test:watch` khi phát triển để nhận feedback tức thì; `npm test` cho CI.

## Bài tập nhỏ

Bài số 2 có một phần "phá hoại" có chủ đích: cố tình làm test fail để hiểu test bảo vệ bạn thế nào.

1. Thêm test "bấm 3 lần count = 3" và "initial mặc định (không truyền props) = 0".
2. Sửa `Counter` thêm nút "Giảm" (−1) rồi viết test cho nó; thử phá component (bỏ `data-testid`) để xem test fail và sửa lại.

## Reference
- https://vitest.dev/
- https://testing-library.com/docs/react-testing-library/intro/
- https://github.com/testing-library/jest-dom (matcher DOM)
- https://legacy.reactjs.org/docs/testing.html