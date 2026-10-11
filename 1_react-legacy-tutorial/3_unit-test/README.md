# 3. Unit Test — Vitest + React Testing Library

> Đối chiếu `3_unit-test` của AngularJS (Karma + Jasmine + **bower** — đã lỗi thời).
> Ở đây dùng **npm hiện đại**: `vitest` + `@testing-library/react` + `jsdom`. Test vẫn chạy được class components (legacy) bình thường.
> Hiện nay nên test function components + hooks, nhưng cú pháp test giống hệt.

## Mục tiêu bài học
- Dựng bộ test cho class component legacy bằng Vitest + React Testing Library (không cần Karma/Jasmine/bower của AngularJS).
- Viết test theo góc nhìn **người dùng**: render component, tương tác bằng `fireEvent`, kiểm tra bằng `screen`.
- Dịch matcher quen thuộc của Jasmine sang `expect` của Vitest.

## Khái niệm cốt lõi (Core)
- AngularJS test: Karma chạy trình duyệt thật + Jasmine `describe/it/expect` + compile template HTML rồi thao tác DOM. Cồng kềnh, phụ thuộc bower.
- React hiện đại: **Vitest** (runner, chạy trên Node) + **jsdom** (giả lập DOM trong Node) + **React Testing Library (RTL)** — render component trong môi trường giả lập rồi tương tác như người dùng.
- RTL triết lý: test **hành vi người dùng thấy** (text, button, role) thay vì state nội bộ hay instance — giống cách test AngularJS qua DOM/template đã biên dịch.
  - `render(<Counter />)` — dựng component.
  - `screen.getByRole("button", { name: /tăng/i })` — tìm nút theo role + text (cách "người dùng" tìm).
  - `fireEvent.click(...)` — mô phỏng bấm.
  - `expect(...).toHaveTextContent("1")` — kiểm tra UI output.
- Matcher map Jasmine → Vitest: cùng tên `toBe`, `toEqual`, `toContain`, `toMatch`, `toBeTruthy/Falsy/Null/Defined`; `toBeCloseTo` xử lý số thực.
- `@testing-library/jest-dom` cung cấp matcher DOM (như `toHaveTextContent`, `toBeInTheDocument`) qua setup file.

### Keyword chính
`vitest` · `jsdom` · `@testing-library/react` · `render` · `screen` · `fireEvent` · `toBeCloseTo` · `describe/it/expect`.

## Luồng hoạt động (Flow)
1. Chạy `npm install` (cài vitest, RTL, jsdom, jest-dom).
2. `npm test` → Vitest đọc config `vitest.config.js` (`environment: "jsdom"`, `setupFiles: ["./vitest.setup.js"]` mang matcher jest-dom vào).
3. Vitest chạy `src/__tests__/*.test.jsx`:
   - Test 1: `render(<Counter initial={5} />)` → `screen.getByTestId("count")` → `toHaveTextContent("5")`.
   - Test 2: `render(<Counter />)` → `fireEvent.click(screen.getByRole("button", {name:/tăng/i}))` → count thành "1".
   - Test 3-4 (functional): `formatVND(1250000)` chứa "₫"; `0.1 + 0.2` `toBeCloseTo(0.3)`.
4. Vitest báo pass/fail theo từng test — tương đương Karma+Jasmine report.

## Ví dụ chi tiết (test)
```jsx
// src/__tests__/Counter.test.jsx — class legacy vẫn test bình thường
import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter, formatVND } from "../Counter";

describe("Counter (class legacy)", () => {
  test("hiển thị giá trị khởi tạo", () => {
    // Render component (giống compile template AngularJS rồi đưa vào DOM)
    render(<Counter initial={5} />);
    // Tìm phần tử có data-testid="count" và kiểm tra text hiển thị
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  test("bấm nút tăng count (↔ ng-click)", () => {
    render(<Counter />);
    // Mô phỏng người dùng bấm nút "Tăng" (getByRole + name regex)
    fireEvent.click(screen.getByRole("button", { name: /tăng/i }));
    // Sau setState + re-render, UI phải hiển thị 1
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});

describe("formatVND (↔ currency filter)", () => {
  test("định dạng tiền VND", () => {
    expect(formatVND(1250000)).toContain("₫");
  });

  test("so sánh số thực dùng toBeCloseTo (↔ Jasmine)", () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3); // 0.30000000000000004 ≈ 0.3
  });
});
```

Component được test (class legacy):
```jsx
// src/Counter.jsx
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: props.initial || 0 };
    this.increment = this.increment.bind(this);
  }
  increment() {
    this.setState(function (prev) { return { count: prev.count + 1 }; });
  }
  render() {
    return (
      <div>
        <p data-testid="count">{this.state.count}</p>
        <button onClick={this.increment}>Tăng</button>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`render(<Counter initial={5} />)`**: RTL dựng component vào DOM giả lập (jsdom). Props truyền như thật — đúng cách test "component chạy như production".
- **`screen.getByTestId("count")`**: `data-testid` là "móc" để tìm phần tử khi không tiện dùng role/text (chấp nhận được cho vùng hiển thị ổn định).
- **`screen.getByRole("button", { name: /tăng/i })`**: tìm theo ARIA role + tên truy cập (text của nút) — giống người dùng thực nhìn. Regex `/tăng/i` chống lệch hoa thường.
- **`fireEvent.click(...)`**: đồng bộ (không async) — sau click, `setState` chạy, RTL bọc re-render, ngay dòng sau kiểm tra `toHaveTextContent("1")` là hợp lệ.
- **`toBeCloseTo`**: `0.1 + 0.2` thực chất là `0.30000000000000004` — so bằng `toBe` sẽ fail; `toBeCloseTo(0.3)` chấp nhận sai số — đúng cách test float (cũng là tương đồng Jasmine).
- **`describe/test/expect`**: cú pháp gần như Jasmine (`describe/it/expect`) — dịch code test cũ sang nhanh.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS (Karma+Jasmine) | React (Vitest+RTL) | Ghi chú |
|---|---|---|
| Karma chạy browser thật | jsdom giả lập DOM trong Node | Nhanh hơn, không cần browser |
| `describe/it/expect` (Jasmine) | `describe/test/expect` (Vitest) | Syntax gần như giống hệt |
| `$compile(template)` + `$scope` | `render(<Comp />)` | Cùng "dựng component lên" |
| `element.find(...)` thao tác DOM | `screen.getByRole/ByText` + `fireEvent` | RTL theo góc nhìn người dùng |
| `toBe`/`toEqual`/`toContain` | `toBe`/`toEqual`/`toContain` | Cùng tên, cùng ý nghĩa |
| `toBeCloseTo` | `toBeCloseTo` | Số thực |
| bower (lỗi thời) | npm | Hệ sinh thái hiện đại |

## Lỗi thường gặp (Common pitfalls)
- **Test instance/state nội bộ** (VD gọi `wrapper.state()` như Enzyme/Jasmine thuần) → test bám vào implementation, đổi code là vỡ. → Test qua UI: text, button, behavior.
- **Quên `screen` import** hoặc dùng `getByTestId` trên phần tử undefined → ReferenceError. → Import đủ từ `@testing-library/react`; nếu không tìm thấy, kiểm tra component render đúng chưa.
- **Dùng `toBe` cho số thực** → fail vì floating point. → Dùng `toBeCloseTo`.
- **Test async (fetch/chờ re-render) dùng `fireEvent` mà không await** → đọc trạng thái cũ. → Với thao tác bất đồng bộ dùng `await screen.findBy...` hoặc `waitFor`.
- **Không cài jest-dom matcher** → `toHaveTextContent` báo không tồn tại. → Đảm bảo `setupFiles` nạp `@testing-library/jest-dom`.

## Best practices / Mẹo
- "Test như người dùng": tìm bằng role + text, không bằng class/id (trừ `data-testid` khi bất khả kháng).
- Một test một hành vi — đọc như tài liệu: "render → action → assert".
- Test cả hàm thuần helper (`formatVND`) tách biệt — nhanh, không cần render (giống test filter của AngularJS).
- Chạy `npm run test:watch` khi phát triển để nhận feedback tức thì; `npm test` cho CI.

## Bài tập nhỏ
1. Thêm test "bấm 3 lần count = 3" và "initial mặc định (không truyền props) = 0".
2. Sửa `Counter` thêm nút "Giảm" (−1) rồi viết test cho nó; thử phá component (bỏ `data-testid`) để xem test fail và sửa lại.

## Reference
- https://vitest.dev/
- https://testing-library.com/docs/react-testing-library/intro/
- https://github.com/testing-library/jest-dom (matcher DOM)
- https://legacy.reactjs.org/docs/testing.html