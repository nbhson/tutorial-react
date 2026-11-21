# 2. Components (class)

> ⚠️ LEGACY: class components. Hiện nay nên dùng function components + hooks.
> Đối chiếu AngularJS `2_modules` (module/controller/directive) và `5_controller`.

## Mục tiêu bài học
- Hiểu component React là gì: một khối UI + logic tự chứa, ghép lại như thẻ HTML.
- Viết được component kiểu legacy `class X extends React.Component` với `render()`.
- Truyền dữ liệu cha → con qua `props` (↔ scope truyền vào directive).

## Khái niệm cốt lõi (Core)

Mục này trả lời câu hỏi nền tảng: component là gì, và nó "giống" directive AngularJS ở chỗ nào, khác ở chỗ nào. Đọc để định hình đơn vị xây dựng cơ bản của React.

- AngularJS chia UI bằng `module` + `controller` + custom `directive` (như `<user-card>`). Dữ liệu truyền vào directive qua binding `scope: {...}`.
- React legacy: **component = class** có phương thức `render()` trả về JSX. Component được dùng như thẻ HTML: `<Hello name="..." />`.
- Dữ liệu truyền từ cha xuống con qua **props** — đối chiếu `$scope` truyền vào directive với `scope: {...}`. Props là object phẳng nằm trong `this.props`, chỉ đọc.
- Component cha có thể chứa component con (composition) — giống directive lồng directive trong AngularJS.
- **Tên class · cách dùng**: class component thường đặt tên PascalCase (`Hello`, `UserCard`) và dùng như thẻ đóng mở `<Hello />`. Thẻ HTML bình thường (`<div>`, `<p>`) vẫn giữ nguyên — React phân biệt bằng chữ hoa ở đầu.
- Mỗi component là "hàm thuần về mặt UI": cùng props → cùng output. Điều này giúp dự đoán, debug và tái sử dụng dễ dàng — đúng tinh thần "thẻ tùy biến có ràng buộc rõ" của directive.

Ví von: component giống khuôn đúc bánh — cùng nguyên liệu (props) nấu theo cùng công thức thì luôn ra cùng chiếc bánh; khuôn nào trộn thêm "nguyên liệu bên ngoài" (biến toàn cục, thay đổi state ngầm) là khuôn hỏng.

> **Tóm gọn 1 câu:** Component là "thẻ HTML tự chế": class + `render()` trả JSX, dữ liệu vào qua props, ghép chồng bằng composition.

### Keyword chính
`Component` · `render()` · `props` · `this.props` · `composition` · `ReactDOM.render`.

## Luồng hoạt động (Flow)

Mục này lần theo cách React "dựng cây": component gốc render → component con khởi tạo → mỗi con render cây JSX của mình → React ráp tất cả vào DOM thật.

1. Trình duyệt tải `index.html` + CDN React 16/Babel → Babel biên dịch `example.jsx`.
2. `ReactDOM.render(<ComponentsDemo />, ...)` khởi tạo component gốc.
3. `ComponentsDemo.render()` chạy → tạo các phần tử `<Hello>` và `<UserCard>` với props kèm theo.
4. React khởi tạo từng component con; mỗi component con gọi `render()` của chính nó để tạo cây Virtual DOM con.
5. React ráp toàn bộ cây lại, render vào DOM thật trong `<div id="root">`.

**Chạy:** mở `index.html` bằng trình duyệt.
- Nếu không thấy nội dung, kiểm tra Console: thường do `App` chưa được render (thiếu dòng `ReactDOM.render`) hoặc CDN chưa tải xong.
- Thử sửa `name` trong `ComponentsDemo` để thấy props được truyền lại mỗi lần render.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`class Hello extends React.Component`**: class kế thừa React.Component → có sẵn `this.props`, `this.state`, `render()`, lifecycle...
- **`render()`**: phương thức DUY NHẤT bắt buộc. Trả về JSX mô tả giao diện; gọi lại mỗi khi props/state đổi.
- **Mỗi component cần `import`/có sẵn `React`**: trong ví dụ CDN, `React.Component` là biến toàn cục do thẻ script nạp; trong dự án npm phải `import React from "react"`. React 16 legacy thường cần có `React` trong scope cho JSX.
- **`<Hello name="Geeks for Geeks" />`**: dùng component như thẻ HTML. Thuộc tính JSX `name` trở thành `this.props.name` bên trong.
- **`<UserCard user={user} />`**: `{user}` vì truyền biến object (không phải chuỗi literal). Props giữ nguyên tham chiếu object.
- **Composition**: `ComponentsDemo` chứa `Hello` + `UserCard` — 1 component render component khác, đúng như directive lồng directive. Không task nào nói đây là "kế thừa" dùng để ghép UI; ghép UI là composition.
- **`this.props` là object**: mọi thẻ thuộc tính trên component gom thành một object. `<Hello name="X" age={3} />` → `this.props = { name: "X", age: 3 }`. Không cần khai báo `scope: {...}` như directive — props tự động.
- **Props không phải HTML attribute**: mặc dù cú pháp giống thẻ HTML, props là dữ liệu JS. Truyền số/object phải dùng `{}` (`age={3}`), còn chuỗi literal mới viết thẳng (`name="X"`).
- **`children`**: nội dung nằm giữa thẻ mở/đóng (`<Card>xin chào</Card>`) được truyền vào component qua `this.props.children` — cách "transclude" của directive AngularJS trong React.
- **Không cần "scope: {...}"**: directive AngularJS phải khai báo binding (`=`, `@`, `&`); component React tự nhận mọi props — chỉ cần đọc `this.props.x`.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này đối chiếu module/controller/directive của AngularJS với class component của React — đọc ngang để thấy React gộp nhiều vai trò vào một khối duy nhất.

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `angular.module("app")` | `class App extends React.Component` | Một module ≈ nhiều component |
| `controller` + template riêng | class component (render trả JSX) | Gộp logic + view |
| custom directive `<user-card>` | `<UserCard />` | Cùng tạo "thẻ HTML" tùy biến |
| `scope: { name: "=" }` trên directive | `this.props.name` | Cùng là dữ liệu truyền vào |
| Directive lồng nhau | Component lồng component (composition) | Tái sử dụng UI theo cây |

> **Cách đọc bảng này:** AngularJS chia việc thành 3 khái niệm (module, controller, directive), còn React gộp cả 3 vào một class component — đọc từng dòng để thấy sự "gộp" này diễn ra ở chỗ nào.

> **Tóm gọn 1 câu:** Một class component của React ≈ module + controller + directive của AngularJS gộp làm một.

## Lỗi thường gặp (Common pitfalls)

Các lỗi dưới đây phần nhiều đến từ thói quen AngularJS (dùng `scope` binding, kế thừa...) — đọc để "gỡ thói quen cũ" sớm.

- **Component trả về nhiều thẻ không bọc** trong React 16: hợp lệ (render có thể trả array), nhưng dễ lỗi layout. → Bọc trong một thẻ cha hoặc dùng array.
- **Quên `render()`** trong class → báo lỗi "Nothing was returned from render". → Luôn có method `render`.
- **Đổi `this.props.x = ...`** (muốn sửa giá trị từ con) → React bỏ qua (props là immutable trong class). → Báo cha thay đổi qua callback (xem bài 3).
- **Dùng class component khi component không cần state/lifecycle** → thừa. → Trong legacy vẫn nên dùng class nhất quán; hiện đại thì function component.
- **Quên `import React`/nạp React trong scope** (dự án npm) → JSX lỗi `React is not defined`. → Đảm bảo `React` có trong file (CDN đã có sẵn biến toàn cục).
- **Tên component viết thường** `<hello />` → React coi là thẻ HTML lạ, không render component. → Tên class component phải viết HOA.
- **Trả về `undefined` khi quên `return` trong render** → React báo "Nothing was returned from render". → Luôn `return` một JSX (hoặc `null` khi muốn render trống).
- **Nhầm composition với kế thừa**: cố `class A extends B` để tái dùng UI → React khuyến khích composition (`children`, tách component). → Ghép component, đừng kế thừa.

> **Tóm gọn 1 câu:** Hai lỗi đáng nhớ nhất: tên component phải viết hoa (thường là React coi là thẻ HTML) và ghép UI bằng composition chứ không kế thừa.

## Best practices / Mẹo
- Một component một trách nhiệm: nếu `render()` quá dài, tách component con.
- Đặt tên props rõ nghĩa (`name`, `user`) giống đặt tên binding trong directive.
- Giữ component "thuần": cùng props → cùng output, dễ test và dự đoán.
- Ưu tiên composition (`children`, tách component) hơn kế thừa — đúng triết lý React.
- Đặt mỗi component một file khi dự án lớn; trong ví dụ CDN giữ chung file cho gọn.
- Kiểm tra props nhận đúng kiểu bằng `PropTypes` (như bài Context) khi component phức tạp.

## Bài tập nhỏ

Hai bài này luyện "chia nhỏ" — kỹ năng quan trọng nhất khi viết component: tách khi render dài, đặt tên props rõ nghĩa.

1. Tạo component `Avatar` nhận prop `url` (ảnh) và `size` (px), render `<img>` với width/height theo size; dùng nó trong `UserCard`.
2. Tách `ComponentsDemo` thành 2 component nhỏ (`Header` + `Body`) và ghép lại — so sánh với việc tách directive trong AngularJS.

## Reference
- https://legacy.reactjs.org/docs/components-and-props.html
- https://legacy.reactjs.org/docs/composition-vs-inheritance.html
- https://legacy.reactjs.org/docs/react-component.html