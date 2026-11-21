# 1. Overview — App mẫu React legacy

> ⚠️ **LEGACY:** ví dụ dùng class components + React 16 UMD qua CDN. Hiện nay nên dùng function components + hooks (xem `3_react-tutorial`).
> Đối chiếu AngularJS: module/controller + digest cycle → React component + Virtual DOM diff.

## Mục tiêu bài học
- Hiểu bức tranh tổng thể của React legacy: JSX, class components, Virtual DOM, `setState` → re-render.
- Biết cách một app React được dựng từ CDN (không cần build tool) và đối chiếu từng mảnh ghép với AngularJS đã học.
- Phân biệt được **one-way data flow + diff Virtual DOM** (React) với **two-way binding + dirty checking** (AngularJS).

## Khái niệm cốt lõi (Core)

Mục này giới thiệu ba trụ cột của React legacy: lịch sử phiên bản, JSX, và Virtual DOM. Đọc để hiểu "React nghĩ khác AngularJS ở điểm nào" trước khi lặn vào code.

### Lịch sử React 15/16 (tóm tắt)
- **2013:** React ra đời tại Facebook. Ý tưởng lõi: **UI = f(state)** — render khai báo thay vì thao tác DOM thủ công. Khác hẳn AngularJS: AngularJS tự quét `$scope` (digest cycle), React thì chủ động render lại khi state đổi.
- **React 15 (2016):** ổn định `React.createClass` → chuyển dần sang `class X extends React.Component` (ES6 class).
- **React 16 (2017):** Fiber reconciler mới, `render()` có thể trả về array/string, Error Boundaries (`componentDidCatch`), `createPortal`. Đây là phiên bản các ví dụ trong tutorial này dùng (UMD `react@16/umd`).
- **React 16.8 (2019):** Hooks ra đời → class components dần thành legacy. Tutorial này giữ class để đối chiếu AngularJS (`controller` ↔ `class`, `$scope` ↔ `this.state`).

Hãy hình dung React như một nhiếp ảnh gia: bạn chỉ cần "đặt cảnh" (mô tả UI theo state), còn việc chụp ảnh lại (vẽ DOM) là việc của React — khác với AngularJS phải tự tay chỉnh từng khung hình.

> **Tóm gọn 1 câu:** React legacy = "UI là hàm của state": bạn mô tả giao diện bằng JSX, React tự tính và vẽ lại phần thay đổi.

### JSX là gì?
JSX là cú pháp mở rộng cho JS, viết UI dạng "HTML trong JS":

> 📄 **Code ví dụ:** [`examples/01-jsx-la-gi.jsx`](examples/01-jsx-la-gi.jsx)

Babel biên dịch thành `React.createElement("h1", {className: "title"}, ...)`. Lưu ý khác AngularJS template:

- `class` → `className`, `for` → `htmlFor` (vì là JS, không phải HTML thuần).
- Mọi expression JS đặt trong `{}`: `{user.name}`, `{list.map(...)}` (↔ `{{ }}` của AngularJS).
- Component là hàm/class trả về JSX, ghép lồng nhau như thẻ HTML.

### Virtual DOM là gì?
Thay vì chạm DOM thật mỗi lần `setState` (đắt), React:

1. Giữ một cây **Virtual DOM** (object JS nhẹ mô tả UI).
2. Khi `state/props` đổi → render lại Virtual DOM mới → **diff** với cây cũ (reconciliation).
3. Chỉ patch những DOM node thật sự thay đổi (batch update).

So với AngularJS: AngularJS dùng **dirty checking / digest cycle** quét `$scope` để cập nhật binding; React dùng **diff Virtual DOM + one-way data flow** (state chảy xuống qua props). Ví von: Virtual DOM giống bản thảo nháp trên giấy nháp — bạn sửa trên giấy nháp bao nhiêu cũng rẻ, chỉ khi xong mới chép đúng những dòng thay đổi lên bản chính (DOM thật).

> **Tóm gọn 1 câu:** Virtual DOM là "bản nháp rẻ tiền" của UI: đổi state → vẽ lại bản nháp → so sánh → chỉ chạm DOM thật ở chỗ khác biệt.

### Keyword chính
`JSX` · `className` · `React.createElement` · `Virtual DOM` · `reconciliation` · `setState` · `one-way data flow` · `digest cycle`.

## Luồng hoạt động (Flow)

Mục này kể lại một vòng đời trọn vẹn: từ lúc mở trang, Babel dịch JSX, đến khi bấm nút và React cập nhật đúng một dòng trên màn hình.

1. Trình duyệt tải `index.html` → nạp CDN `react` + `react-dom` + `babel-standalone` (cần internet).
2. Babel (chạy ngay trong trình duyệt) biên dịch `App.jsx` (cú pháp JSX/ES6) thành JS thuần.
3. `ReactDOM.render(<App />, document.getElementById("root"))` mount cây component vào `<div id="root">`.
4. Khi render: `App` render `<Hello>` (đọc `props.name`), `<SortList>` (đọc `this.state.sort`), và nút đếm đọc `this.state.count`.
5. Bấm "Tăng" → `this.setState(...)` → React render lại Virtual DOM mới → diff với cây cũ → chỉ cập nhật node `<p>Count: ...</p>` trong DOM thật.

**Cách chạy:**
- Cách 1 — mở trực tiếp: mở `1_overview/index.html` bằng trình duyệt (cần internet cho CDN).
- Cách 2 — npm + Vite (hiện đại, vẫn viết class): `cd 1_overview && npm install && npm run dev`.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.jsx`](examples/02-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`class Hello extends React.Component`**: component chỉ nhận props để hiển thị — tương đương một standalone directive của AngularJS nhận `scope`.
- **`constructor`**: nơi khởi tạo `this.state` (↔ `ng-init` / controller gán giá trị lên `$scope`) và bind handler. `super(props)` bắt buộc.
- **`this.setState(...)`**: cách duy nhất để đổi state trong class. React KHÔNG tự phát hiện thay đổi (không có dirty checking); bạn phải *báo* cho React qua `setState`.
- **`{this.state.count}` / `{one}`**: expression trong JSX luôn nằm trong cặp `{}` — giống `{{ }}` của AngularJS nhưng là JS thật sự (có thể `+`, `map()`, gọi hàm...).
- **`onClick={this.increment}`**: truyền *hàm* chứ không gọi hàm; `this` đã được bind sẵn nên `increment` vẫn gọi đúng `setState` của instance.

## So sánh AngularJS ↔ React (bảng markdown)

Mục này là "từ điển song ngữ" AngularJS → React: cột trái là khái niệm cũ bạn đã biết, cột giữa là tên mới, cột phải nói rõ khác biệt tinh tế. Đọc từ trên xuống theo thứ tự từ đơn giản (template) đến phức tạp (binding).

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `module` + `controller` | `class X extends React.Component` | Cùng tách logic/UI thành đơn vị |
| `$scope.name` | `this.state.name` | Cả hai đều là "state" nhưng cách cập nhật khác hẳn |
| `{{ name }}` | `{this.state.name}` trong JSX | Expression đặt trong `{}` |
| `ng-click="fn()"` | `onClick={this.handler}` | React truyền hàm, phải bind `this` |
| Digest cycle (dirty checking) | `setState` → render lại Virtual DOM + diff | AngularJS quét toàn bộ binding; React chủ động chỉ patch phần đổi |
| Two-way binding (`ng-model`) | One-way data flow (state → props) | React không có tự động đồng bộ 2 chiều |
| Template HTML riêng | JSX (HTML trong JS) | `class` → `className`, `for` → `htmlFor` |

> **Cách đọc bảng này:** mỗi dòng là một cặp "tên cũ → tên mới"; đọc cột *Ghi chú* để thấy không chỉ đổi tên mà cách vận hành cũng khác hẳn — đặc biệt dòng dirty checking vs Virtual DOM.

> **Tóm gọn 1 câu:** Bảng trên là "câu chéo" để đổi tư duy: đổi tên thẻ dễ, đổi tư duy từ two-way sang one-way mới là phần khó.

## Lỗi thường gặp (Common pitfalls)

Mục này liệt kê những "bẫy" người mới từ AngularJS hay dính nhất khi sang React — đọc trước để khỏi mất công debug những lỗi kiểu này.

- **Quên `super(props)`** trong constructor → chạy báo `Must call super constructor`. → Luôn gọi `super(props)` đầu tiên.
- **Gán thẳng `this.state.count = 1`** → React không biết, không re-render. → Luôn dùng `this.setState()`.
- **`setState` với object khi phụ thuộc state cũ** (`this.setState({count: this.state.count + 1})` bấm nhanh 2 lần) → có thể mất bước vì setState bất đồng bộ/batch. → Dùng dạng hàm `setState(function(prev){...})`.
- **`onClick={this.increment()}`** (gọi luôn khi render) → hàm chạy ngay lập tức, không chờ bấm. → Truyền tham chiếu hàm, không có dấu `()`.
- **Nghĩ React giống AngularJS tự đồng bộ khi đổi biến** → state không đổi là UI không đổi. → Mọi thay đổi phải đi qua `setState`.

> **Tóm gọn 1 câu:** Trong React, "đổi biến" không có nghĩa là "đổi màn hình" — phải gõ cửa bằng `setState` React mới ra làm việc.

## Best practices / Mẹo

- Viết component nhỏ, một component một việc (giống tách directive).
- Khởi tạo state bằng constructor; nếu dữ liệu tính được từ props thì đừng nhân bản vào state.
- Đặt `this.state` đúng chỗ trong constructor để đọc code dễ hiểu, đúng thứ tự lifecycle.

## Bài tập nhỏ

Làm tay hai bài này để biến kiến thức trên thành phản xạ — đọc hiểu chưa đủ, phải tự gõ mới nhớ.

1. Thêm component `Footer` hiển thị năm hiện tại từ `new Date().getFullYear()`, rồi đưa vào `App` như `<Hello>`.
2. Đổi nút "Tăng" thành nút "Tăng 2" (cộng 2 mỗi lần bấm) và thêm nút "Reset" — kiểm tra xem setState dạng hàm có cần thiết không.

## Reference
- https://legacy.reactjs.org/docs/getting-started.html
- https://legacy.reactjs.org/docs/introducing-jsx.html
- https://legacy.reactjs.org/docs/state-and-lifecycle.html
- https://react.dev/ (bản hiện đại)