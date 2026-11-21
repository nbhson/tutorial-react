# 3. Props & State

> ⚠️ LEGACY: class + `this.state`/`this.setState`. Hiện nay nên dùng `useState`.
> Đối chiếu AngularJS `$scope` (state) và `ng-model` (two-way binding).

## Mục tiêu bài học
- Phân biệt **props** (dữ liệu từ cha, chỉ đọc) và **state** (dữ liệu nội bộ, đổi được).
- Cập nhật state đúng cách bằng `this.setState()` và hiểu vì sao React re-render.
- Hiểu **one-way data flow**: state ở cha → props xuống con; con muốn đổi phải gọi callback của cha (KHÔNG có two-way binding tự động như `ng-model`).

## Khái niệm cốt lõi (Core)

Mục này nói về phân biệt sống còn giữa props và state — hai loại dữ liệu, hai quy tắc khác nhau. Đọc để biết thứ gì được sửa, thứ gì không, và "báo" cho React bằng cách nào.

- **props**: tham số cha truyền vào component — như binding `scope: {...}` của directive. Không được gán lại; đổi props nghĩa là cha phải render lại với giá trị mới.
- **state**: bộ nhớ nội bộ của component — như `$scope` gắn với từng controller. Điểm khác sống còn: AngularJS tự "biết" khi `$scope` đổi (dirty checking/digest), còn React **phải được báo** qua `this.setState()`; gán trực tiếp `this.state.x = 1` thì React không re-render.
- `this.setState(...)` **bất đồng bộ**, có thể **gộp (batch)** nhiều lần gọi trong cùng một sự kiện. Vì vậy khi giá trị mới phụ thuộc giá trị cũ, hãy dùng dạng hàm: `this.setState(function (prev) { return ...; })`.
- **Shallow merge**: `setState({ age: 11 })` chỉ thay key `age`, các key khác trong state giữ nguyên — không cần truyền cả object state. Giống AngularJS gán `$scope.age = 11` mà `$scope` vẫn còn các field khác.
- **Luồng "con muốn đổi"**: con không sửa state của cha; cha truyền xuống hàm `onXxx={this.handler}` qua props, con gọi nó. Đây chính là pattern "callback prop" thay cho `$scope.$emit`/`ng-model`.
- **One-way data flow**: dữ liệu chỉ chảy một chiều cha → con. Muốn con báo lên cha: cha truyền callback qua props, con gọi callback đó. Đây là mô hình khác hẳn `ng-model`.
- **State không chia sẻ toàn cục**: mỗi class có `this.state` riêng, không có `$rootScope`. Muốn chia sẻ, nâng state lên component cha chung (lifting state up).
- **State là object**: `this.state` luôn là một object (không phải biến rời như `$scope`). Truy cập qua `this.state.x`; nhiều field gom vào object chung.

Ví von: props giống **thư được gửi đến** — bạn đọc được nhưng không sửa nội dung thư, muốn thay đổi thì viết thư mới gửi lại; state giống **cuốn nhật ký riêng** — bạn được tự viết, nhưng phải viết đúng quy trình (`setState`) thì React mới "đọc lại" và vẽ lại UI.

> **Tóm gọn 1 câu:** Props là thư đến (chỉ đọc), state là nhật ký riêng (đổi qua `setState`) — React one-way: con muốn ngược lên phải gọi callback cha truyền xuống.

### Keyword chính
`props` · `state` · `setState` · `re-render` · `one-way data flow` · `callback prop` · `batch`.

## Luồng hoạt động (Flow)

Mục này chạy một vòng đời dữ liệu trọn vẹn: state khởi tạo → render → người dùng gõ → setState → render lại. Đó chính là vòng "one-way" mà mọi bài sau đều dựa vào.

1. `PropsStateDemo` khởi tạo state `{ name: "Geeks", age: 10 }` (↔ `$scope.name`).
2. `render()`: đưa `this.state.name` xuống `<Greeting name={...} />` như prop; input `value={this.state.name}` + `onChange={this.handleName}`.
3. Người dùng gõ vào input → `handleName(e)` chạy → `this.setState({ name: e.target.value })`.
4. React nhận biết state đổi → gọi lại `render()` → tạo Virtual DOM mới → diff → cập nhật `<Greeting>` và input trong DOM thật.
5. Bấm "+1 tuổi" → `birthday()` → `setState` dạng hàm `prev.age + 1` → re-render phần tuổi.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`<Greeting name={this.state.name} />`**: state của cha thành props của con. Con không biết (và không cần biết) giá trị đến từ đâu — giống directive chỉ thấy binding của nó.
- **`<input value={this.state.name} onChange={this.handleName} />`**: "controlled input" — input hiển thị đúng giá trị state; người dùng gõ → `handleName` đẩy giá trị lên state → React render lại → input nhận giá trị mới. Đây chính là cách thay thế `ng-model`.
- **`this.setState({ name: e.target.value })`**: gán một phần state; React merge vào state hiện tại (shallow merge).
- **`this.setState(function (prev) {...})`**: dạng hàm nhận state cũ, trả state mới. Dùng khi giá trị mới *phụ thuộc* giá trị cũ (tăng tuổi). Tránh race condition vì setState có thể batch.
- **`this.handleName.bind(this)`**: trong class, method không tự bind; không bind thì khi gọi qua `onChange`, `this` bị undefined.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này đặt `$scope` và `this.state` cạnh nhau để thấy khác biệt cơ chế quan trọng nhất: Angular tự "ngửi" thấy thay đổi, React phải được báo.

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `$scope.name` (gắn trực tiếp) | `this.state = { name }` | Cùng chỗ chứa dữ liệu component |
| Gán `$scope.name = "x"` → digest tự cập nhật | `this.setState({name:"x"})` → React mới re-render | React không tự "bắt" thay đổi |
| `ng-model="name"` (two-way binding) | `value={state.name}` + `onChange` (viết tay) | React one-way, rõ ràng hơn |
| Directive nhận binding từ controller | Component nhận props từ cha | Cùng là luồng cha → con |
| `$scope.$apply` (ép digest) | `setState` (báo React recycle) | Làm thủ công cả hai, khác cơ chế |

> **Cách đọc bảng này:** mỗi dòng là một thao tác dữ liệu quen thuộc; cột *Ghi chú* luôn nhấn cùng một ý — Angular tự phát hiện thay đổi, React đợi bạn gọi `setState`.

> **Tóm gọn 1 câu:** `$scope` là "bánh tự nướng" (digest tự chạy), `this.state` là "gọi món" — không gọi `setState` thì React không làm.

## Lỗi thường gặp (Common pitfalls)

Mục này tập trung vào loại lỗi "code chạy mà UI không đổi" — nguyên nhân 9/10 là gán `this.state` trực tiếp hoặc quên bind.

- **Gán `this.state.name = "x"`** → UI không đổi vì React không được báo. → Dùng `setState`.
- **`this.setState({ age: this.state.age + 1 })` gọi liên tục trong một hàm** → có thể chỉ tăng 1 vì setState batch/async. → Dùng dạng hàm `setState(prev => ...)`.
- **Đổi props trong component con** (`this.props.name = ...`) → vô tác dụng, cảnh báo trong dev. → Thay đổi phải do cha thực hiện qua callback.
- **Quên `bind(this)`** rồi truyền handler: `onClick={this.birthday}` → bấm nút báo `this is undefined`. → Bind trong constructor (hoặc arrow function — nhưng tutorial giữ bind đúng chất legacy).
- **Nhân bản props vào state** rồi tự cập nhật khi props đổi → state cũ không đồng bộ. → Ưu tiên dùng props trực tiếp; chỉ khởi tạo state từ props trong constructor.
- **Gọi `setState` rồi đọc `this.state` ngay sau đó** → đọc giá trị cũ (vì bất đồng bộ). → Cần giá trị mới, dùng callback thứ hai của `setState` hoặc tính từ `prev`.
- **Quên bind handler truyền xuống con** → con gọi `onChange` thì `this` undefined. → Bind trong constructor trước khi truyền; hoặc truyền arrow function từ cha.

> **Tóm gọn 1 câu:** Ghi nhớ 2 cấm kỵ: không gán `this.state` trực tiếp, không sửa `this.props` — một cái React không thấy, một cái "thư đến" không được trả lời.

## Best practices / Mẹo
- Phân loại dữ liệu: thứ gì chỉ hiển thị → props; thứ gì component tự quản → state.
- Dùng dạng hàm cho mọi `setState` phụ thuộc state cũ — thói quen an toàn.
- Giữ state tối thiểu, "single source of truth": dữ liệu dùng chung nên đặt ở component cha và truyền xuống.
- Không lưu dữ liệu "tính được" vào state (VD tổng của mảng) — tính lại khi render, tránh lệch.
- Đặt tên handler theo hành động (`handleName`, `birthday`) để render đọc như tự nhiên.
- Khi có nhiều field, dùng `[e.target.name]` + một handler (xem bài Forms) để giảm lặp.
- Chỉ truyền xuống con những props nó cần; con "mù" với phần state không liên quan — dễ tái sử dụng.
- Dùng `setState(prev => ...)` khi giá trị mới dựa trên giá trị cũ; tránh đọc trực tiếp `this.state` trong cùng tick.

## Bài tập nhỏ

Bài số 2 ở đây chứng minh one-way flow bằng thực hành: sửa state của con không bao giờ ảnh hưởng cha.

1. Thêm nút "Xóa tên" đặt `name` thành rỗng và input hiện placeholder khi trống.
2. Thêm prop `initialAge` cho `PropsStateDemo` (khởi tạo age từ props) và kiểm tra: bấm "+1" có ảnh hưởng đến component cha không? (nhấn mạnh one-way flow).
3. Thêm component con `Counter` chỉ nhận `value` + `onChange` từ cha, chứng minh con không tự sửa state.

## Reference
- https://legacy.reactjs.org/docs/state-and-lifecycle.html
- https://legacy.reactjs.org/docs/components-and-props.html
- https://legacy.reactjs.org/docs/thinking-in-react.html