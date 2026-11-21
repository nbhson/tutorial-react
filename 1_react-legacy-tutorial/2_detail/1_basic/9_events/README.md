# 9. Events (sự kiện)

> ⚠️ LEGACY: class + `bind(this)`. Hiện nay: function components (không cần bind).
> Đối chiếu AngularJS `10_event` (`ng-click`, `ng-change`, `ng-blur`...).

## Mục tiêu bài học
- Dùng sự kiện chuẩn REACT trong JSX: `onClick`, `onChange`, `onBlur`, `onSubmit` (camelCase).
- Hiểu vì sao phải **bind `this`** trong class component và cách bind đúng ở constructor.
- Làm việc với **SyntheticEvent** (`e.target.value`, `e.preventDefault()`) và submit form.

## Khái niệm cốt lõi (Core)

Mục này nói về hệ thống sự kiện của React: cách đặt tên, cách truyền handler, và cái khó nhất khi dịch từ AngularJS — bind `this`. Đọc để tránh cả hai lỗi "chết im lặng" và "chạy quá sớm".

- AngularJS: `ng-click="fn()"` — Angular tự bind scope, cú pháp gọi hàm với `()`. Template theo kiểu "string directive".
- React: event là **prop JSX**, tên camelCase (`onClick`, `onChange`), giá trị là **tham chiếu hàm** (không gọi). 
- Điểm khó nhất khi dịch từ AngularJS: **`this` không được tự động bind**. Trong class, khi `onClick={this.handle}` đã truyền *tham chiếu* hàm, lúc React gọi nó, `this` bên trong sẽ là `undefined` (strict mode) vì hàm đã tách khỏi instance. → Phải bind trong constructor: `this.handle = this.handle.bind(this)`.
- Event của React là **SyntheticEvent** — wrapper chuẩn hóa mọi trình duyệt, đảm bảo cùng behavior; dùng như event DOM thường: `e.target.value`, `e.preventDefault()`, `e.target.files`... 
- **SyntheticEvent được "pool" (gom tái sử dụng) trong React legacy** — nghĩa là object event chỉ hợp lệ ngay trong handler, sau đó bị reset. Đừng lưu `e` lại rồi đọc sau (VD trong callback async); cần thì chép giá trị ra ngay (`const value = e.target.value`). React 17+ đã bỏ pooling này, nhưng tài liệu legacy vẫn nhắc.
- **Tên sự kiện camelCase**: `onClick` (không `onclick`), `onDoubleClick`, `onMouseOver`... React chuẩn hóa tên để nhất quán giữa các trình duyệt.

Ví von: truyền handler trong React giống đưa *bản đồ* cho người lái xe chứ không phải *ra lệnh "đi ngay"* — `onClick={this.handle}` đưa tham chiếu hàm (bản đồ), còn `onClick={this.handle()}` là gọi hàm ngay lúc render (đi luôn trước cả khi khách lên xe).

> **Tóm gọn 1 câu:** Event React = prop camelCase nhận *tham chiếu hàm* + `bind(this)` trong constructor — thiếu bind thì `this` thành undefined lúc sự kiện chạy.

### Keyword chính
`onClick` · `onChange` · `onBlur` · `onSubmit` · `.bind(this)` · `SyntheticEvent` · `e.preventDefault()`.

## Luồng hoạt động (Flow)

Mục này lần theo 3 loại sự kiện trong ví dụ: click nút (bind + setState), gõ input (onChange từng ký tự), và submit form (preventDefault).

1. Constructor chạy → bind toàn bộ handler: `this.increment = this.increment.bind(this)` (…), và khởi tạo state `{ count, text, blurred }`.
2. Render → JSX gắn handler: `onClick={this.increment}`, `onChange={this.handleChange}`, `onBlur={this.handleBlur}`, `onSubmit={this.handleSubmit}`.
3. Bấm `+` → React gọi `this.increment` với `this` đã bind → `setState` function form → re-render, count tăng.
4. Gõ input → `handleChange` → `setState({text})` (↔ `ng-change`). Rời ô input (`blur`) → `handleBlur` → `blurred: true`.
5. Bấm Submit trong form → browser chuẩn bị reload → `handleSubmit` gọi `e.preventDefault()` chặn lại → `alert`.
6. Mỗi lần sự kiện, handler đọc giá trị `e.target.value`/`checked` *ngay trong lúc xử lý* (vì SyntheticEvent bị pool) rồi đưa vào state.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`this.handleChange = this.handleChange.bind(this)`**: trả về bản copy của hàm với `this` cố định vào instance. Nhờ đó `onChange={this.handleChange}` chạy đúng, gọi được `this.setState`.
- **`onChange={this.handleChange}`**: không dùng `()` — truyền hàm, React gọi khi sự kiện xảy ra. `onChange` trong React ≈ `input`/`change` DOM (chạy mỗi lần gõ).
- **`e.target.value`**: `e` là SyntheticEvent; `e.target` là input DOM thật → đọc giá trị gõ vào. Khác AngularJS có sẵn `$event`, nhưng cùng mục đích.
- **`e.preventDefault()`**: submit form mặc định reload trang; phải chặn lại nếu muốn xử lý bằng JS. `alert` minh họa dữ liệu submit lấy từ **state** (controlled).
- **`this.state.blurred && <p>...`**: conditional render khi cờ đổi — cùng ý `ng-if` với biến trong `$scope`.
- **Vì sao `onChange` chạy mỗi ký tự?**: React gắn `onChange` vào sự kiện `input` (không phải `change` DOM chỉ fire khi mất focus). Điều này giúp controlled input đồng bộ từng ký tự — đúng như `ng-model` + `ng-change`.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này dịch từng directive sự kiện của AngularJS sang prop JSX tương ứng — kèm "cú sốc văn hóa" lớn nhất: tự bind `this`.

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-click="fn()"` | `onClick={this.fn}` | React truyền tham chiếu, Angular viết kiểu string |
| `ng-change="fn()"` | `onChange={this.handleChange}` | Cùng bám vào thay đổi input |
| `ng-blur="fn(var)"` | `onBlur={this.handleBlur}` | Same behavior khác tên |
| `ng-submit` / `$event.preventDefault()` | `onSubmit` + `e.preventDefault()` | Chặn reload thủ công |
| Angular tự bind scope | Phải `.bind(this)` | Sốc văn hóa khi dịch code |
| `$event` | `e` (SyntheticEvent) | Wrapper chuẩn hóa cross-browser |

> **Cách đọc bảng này:** mỗi dòng là một cặp directive ↔ prop; đọc cột *Ghi chú* để thấy cùng hành vi nhưng cơ chế khác nhau — nhất là 2 dòng cuối về bind và SyntheticEvent.

> **Tóm gọn 1 câu:** `ng-click="fn()"` thành `onClick={this.fn}` — đổi từ chuỗi lệnh sang tham chiếu hàm, và giá phải trả là tự bind `this`.

## Lỗi thường gặp (Common pitfalls)

Sự kiện là nơi sinh ra lỗi "âm thầm" nhiều nhất: sự kiện chết không báo, hoặc hàm chạy sớm không ai gọi.

- **Quên bind** → bấm nút báo `this is undefined` (hoặc lỗi setState). → Bind mọi handler trong constructor.
- **`onClick={this.increment()}`** → hàm chạy luôn lúc render, count tăng ngay không cần bấm. → Bỏ `()`.
- **Submit form mà quên `e.preventDefault()`** → trang reload, mất state. → Luôn chặn event mặc định khi xử lý bằng JS.
- **Dùng `onclick`/`onchange` (chữ thường)** → React không nhận (chỉ có camelCase), sự kiện chết im lặng. → Dùng `onClick`, `onChange`...
- **Nhầm `onChange` của React với `change` DOM** (chỉ fire khi mất focus) → React `onChange` fire mỗi lần gõ. Đây là điểm khác người AngularJS hay quên — nhưng ở đây đúng ý `ng-change`.
- **Lưu event `e` rồi đọc sau** (VD trong `setTimeout`) → giá trị `e.target` có thể đã bị reset do pooling. → Chép `const value = e.target.value` ra biến trước.
- **Tưởng `onClick` cần `()`**: viết `onClick={this.increment()}` → chạy ngay khi render. → Truyền tham chiếu, không gọi.

> **Tóm gọn 1 câu:** Hai lỗi số một với event: thiếu dấu `{}` đúng chỗ thì sự kiện chết im lặng, thừa dấu `()` thì hàm chạy ngay khi render.

## Best practices / Mẹo
- Trong class legacy: bind hết trong constructor để hàm ổn định giữa các render (không tạo hàm mới mỗi lần render như inline arrow nếu không cần).
- Cần truyền tham số cho handler? Dùng closure: `onClick={function(){ self.remove(id); }}` hoặc bind: `onClick={this.remove.bind(this, id)}`.
- Nhóm handler theo mục đích (`handleXxx`) để render() dễ đọc.
- Với form: dùng `onSubmit` (có `preventDefault`) thay vì gắn click vào nút submit — để hỗ trợ cả Enter trên bàn phím như form HTML chuẩn.
- Kiểm tra handler trên nhiều loại sự kiện khác nhau: `onMouseEnter`, `onKeyDown`, `onFocus` — cùng cơ chế `SyntheticEvent`.
- Gộp handler cho nhiều field bằng `e.target.name` (xem bài Forms) để tránh lặp bind.
- Bind trong constructor giữ tham chiếu hàm ổn định; nếu dùng arrow method thì không cần bind nhưng đây là ví dụ legacy nên ưu tiên bind.
- Với sự kiện bàn phím, nhớ `e.preventDefault()` khi muốn chặn hành vi mặc định (VD Enter trong input).
- Giữ handler ngắn, gọi hàm phụ nếu logic dài — dễ test và tái dùng.
- React gắn sự kiện bằng ủy quyền ở root, nên không cần lo số lượng listener khi render nhiều phần tử (`↔` ít `ng-click` rải rác).

## Bài tập nhỏ

Bài số 4 đáng suy ngẫm: hai cách truyền tham số (arrow vs bind) đều tạo hàm mới mỗi render — làm xong sẽ hiểu trade-off của từng cách.

1. Thêm input thứ hai (email) dùng chung một `handleChange` bằng cách đọc `e.target.name` — so sánh cách này với một handler mỗi field.
2. Đổi `alert` thành hiển thị chuỗi "Đã submit: ..." ngay trong UI (state `submitted`), kiểm tra form không reload.
3. Thêm `onKeyDown` hiển thị phím vừa bấm (↔ `ng-keydown`) và log `e.key`.
4. Thêm một handler có tham số bằng `onClick={() => this.pick(id)}` và so sánh với `this.pick.bind(this, id)` — cả hai đều tạo hàm mới mỗi render, nêu khác biệt.

## Reference
- https://legacy.reactjs.org/docs/handling-events.html
- https://legacy.reactjs.org/docs/events.html (danh sách SyntheticEvent)
- https://legacy.reactjs.org/docs/faq-functions.html