# 7. Refs (truy cập DOM)

> ⚠️ LEGACY: string refs đã bỏ, callback refs/`createRef` thời class. Hiện nay: `useRef`.
> Đối chiếu AngularJS `9_html-dom` (thao tác DOM trong directive/controller).

## Mục tiêu bài học
- Hiểu khi nào cần ref: focus input, đo kích thước, gọi API của thư viện DOM — những việc state/props không làm được.
- Dùng `React.createRef()` trong class: tạo ref, gắn vào element, đọc `this.inputRef.current`.
- Phân biệt controlled (dữ liệu đi qua state) với thao tác DOM trực tiếp qua ref (imperative).

## Khái niệm cốt lõi (Core)
- "Cách React nghĩ": UI = f(state). Bạn **không chạm DOM** để cập nhật giao diện — bạn đổi state, React tự lo DOM. Nhưng có những việc *imperative* bắt buộc chạm DOM thật: focus input, scroll, đo kích thước, tích hợp thư viện DOM (chart, video...).
- **Ref** = "vé" tham chiếu đến một DOM node (hoặc instance component). Trong class React 16: `React.createRef()` tạo container trong constructor, gắn `ref={this.inputRef}` vào element; sau khi mount, `this.inputRef.current` chứa node DOM thật.
- Đối chiếu AngularJS: `angular.element(selector)` truy vấn theo selector; React thì gắn ref trực tiếp vào chính element trong JSX — khai báo rõ hơn, không phụ thuộc id/class.
- **Nguyên tắc**: ref chỉ cho thao tác DOM *bất khả kháng*; đừng dùng ref để đọc/ghi dữ liệu lẽ ra phải nằm trong state.
- **Ref vs state**: state là "nguồn sự thật" cho UI khai báo; ref là "cửa hậu" imperative. Nếu giá trị đó cần hiển thị/kiểm soát, hãy để vào state; nếu chỉ cần *gọi hành động* một lần (focus, scroll), dùng ref.
- **Ref có tồn tại ngay từ đầu không?** Không. `current` chỉ được React gán sau khi element mount. Trước đó `current = null` — nên truy cập ref trong `render()`/constructor sẽ lỗi.
- **Các kiểu ref trong lịch sử**:
  - *String ref* `ref="input"` + `this.refs.input` — kiểu cổ, **đã bị bỏ**; đừng dùng.
  - *Callback ref* `ref={function(el){ this.inputRef = el; }}` — React gọi hàm với node khi mount (và `null` khi unmount); linh hoạt nhưng thủ công.
  - *`React.createRef()`* (React 16.3+) — cách khuyến nghị thời class, tạo object `{current}` ổn định. Hiện đại thay bằng `useRef`.
- Ref tới element DOM nào cũng được: `div`, `input`, `video`, `canvas`...; ref tới **class component** cho `current` là instance (gọi được method của nó), nhưng không ref được vào function component (không có instance).
- **Tương đương AngularJS**: `angular.element(el)[0]` cho node thô; React `ref.current` cho cùng node nhưng gắn khai báo ngay trong JSX thay vì truy vấn selector.

### Keyword chính
`React.createRef()` · `ref` · `ref.current` · `focus()` · `imperative DOM`.

## Luồng hoạt động (Flow)
1. Constructor chạy → `this.inputRef = React.createRef()` — container rỗng, `current = null`.
2. `render()` → JSX có `<input ref={this.inputRef} defaultValue="Geeks" />`.
3. React mount cây → gán node DOM thật của input vào `this.inputRef.current`.
4. Bấm **Focus** → `this.focus()` → `this.inputRef.current.focus()` → con trỏ nhảy vào input (thao tác imperative).
5. Bấm **Xóa + focus** → `this.clear()` → gán `this.inputRef.current.value = ""` rồi focus.
6. Khi component unmount → React gán `this.inputRef.current = null` (tránh giữ lại node DOM đã gỡ).

**Chạy:** mở `index.html`, bấm nút để focus/clear input.

## Ví dụ chi tiết
```jsx
// LEGACY createRef — đối chiếu thao tác DOM của AngularJS.
class RefsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef(); // tạo "container" ref, ban đầu current=null
    this.focus = this.focus.bind(this);
    this.clear = this.clear.bind(this);
  }
  focus() {
    // current trỏ đến input DOM thật (React gán sau khi mount)
    this.inputRef.current.focus(); // ↔ angular.element(...)[0].focus()
  }
  clear() {
    // Thao tác DOM trực tiếp — đây là GHI DOM, tránh lạm dụng
    this.inputRef.current.value = "";
    this.inputRef.current.focus();
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Refs (focus input)</h2>
        {/* Gắn ref vào element; defaultValue: chỉ khởi tạo lần đầu */}
        <p><input ref={this.inputRef} placeholder="Nhập tên..." defaultValue="Geeks" /></p>
        <p>
          <button onClick={this.focus}>Focus</button>{" "}
          <button onClick={this.clear}>Xóa + focus</button>
        </p>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`React.createRef()`**: tạo object `{ current: null }`. Tạo trong constructor để ref ổn định qua các lần render (đừng tạo trong render).
- **`ref={this.inputRef}`**: khi element mount, React gán node DOM vào `.current`; khi unmount, trả về `null`. Đây là lúc ref "có giá trị" — KHÔNG có sẵn ngay trong constructor.
- **`this.inputRef.current.focus()`**: gọi phương thức DOM thật. So với AngularJS `angular.element(input).triggerHandler('focus')` hay `input[0].focus()` — cùng là thao tác DOM, khác cách lấy node.
- **`defaultValue="Geeks"`**: vì ta KHÔNG controlled input này (không dùng `value` + `onChange`), nên dùng `defaultValue` để đặt giá trị ban đầu. `value` thuần (không có onChange) sẽ bị React "đóng băng" không cho sửa.
- **Vì sao `clear()` gán thẳng `current.value` được?**: vì input không controlled — React không quản lý value, nên gán DOM trực tiếp không đụng độ vòng lặp state.
- **`this` và ref**: `this.inputRef` là thuộc tính của instance, tồn tại suốt vòng đời component. React giữ nguyên object ref giữa các lần render — nhờ tạo trong constructor mà không bị "tạo mới" mỗi render.
- **`ref` không tạo thêm render**: gắn ref hay đọc `.current` đều không gây re-render (khác `setState`). Đây là lý do ref hợp cho thao tác "âm thầm" như focus; nhưng cũng nghĩa là UI không tự cập nhật theo ref.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `angular.element('#id')` truy vấn | `ref={this.inputRef}` gắn trực tiếp | React khai báo trên chính element |
| `$scope.$watch` + jqLite `val()` | `value` + `onChange` (controlled) | Ưu tiên controlled trước |
| `element[0].focus()` | `this.inputRef.current.focus()` | Cùng gọi DOM API |
| Thao tác DOM trong directive | Ref chỉ dùng khi bất khả kháng | React khuyến khích ít chạm DOM |
| — | `createRef` (React 16.3+) | Thay string refs đã deprecated |

## Lỗi thường gặp (Common pitfalls)
- **Đọc `this.inputRef.current` ngay trong `render()`** → `null` vì chưa mount. → Chỉ đọc trong sự kiện/lifecycle (`componentDidMount` trở đi).
- **Tạo ref trong `render()`** (`ref={React.createRef()}`) → ref mới mỗi render, gán/không gán lung tung. → Tạo trong constructor.
- **Dùng `value` không kèm `onChange` trên input có ref** → input không sửa được ("read-only"). → Hoặc dùng `defaultValue`, hoặc chuyển sang controlled.
- **Dùng ref để đọc giá trị input khi submit** → bỏ qua state, khó test/khó theo dõi. → Nếu giá trị quan trọng, để vào state (controlled).
- **Lạm dụng ref để "tự sửa DOM" mỗi lần state đổi** → phá vỡ Virtual DOM diff. → Cập nhật UI bằng state/props, ref chỉ cho hành động imperative (focus, scroll).
- **Dùng ref cho hai element / quên gắn `ref`** → `current` là null hoặc trỏ sai node. → Mỗi ref một element; kiểm tra `if (this.inputRef.current)` khi không chắc.
- **String ref `ref="input"` (kiểu cũ)** → đã bị bỏ ở React 16, cảnh báo/không chạy. → Dùng `createRef` (hoặc callback ref).

## Best practices / Mẹo
- Thứ tự ưu tiên: (1) state/props, (2) controlled input, (3) mới nghĩ đến ref.
- Đặt ref cho những việc điển hình: autofocus, đo kích thước bằng `getBoundingClientRect()`, tích hợp plugin DOM.
- Muốn ref tới component class con (gọi method của nó) cũng được: gắn ref lên component, `current` là instance — nhưng hạn chế dùng (phá vỡ tính khai báo).
- Gọi DOM API trong lifecycle (`componentDidMount`) hoặc sự kiện (an toàn vì `current` đã có); tránh gọi trong `render()`.
- Đặt tên ref theo việc dùng (`inputRef`, `videoRef`) để phân biệt rõ đâu là ref DOM, đâu là state.
- Trong `componentWillUnmount`, nếu cần "quên" ref, gán lại `this.inputRef = React.createRef()` — nhưng thường không cần vì React tự đặt `current = null`.
- Ref không thay thế `id`/`class` cho styling — chỉ dùng để thao tác DOM; đừng gắn ref khắp nơi.
- Có thể dùng `ref` để gọi `scrollIntoView()` khi mở modal/chat — ví dụ imperative rất hợp.
- Với form phức tạp, cân nhắc chuyển sang controlled input + state thay vì đọc ref khi submit.
- Khi tích hợp thư viện DOM ngoài (chart, editor), gọi nó trong `componentDidMount` với `ref.current` rồi dọn dẹp trong `componentWillUnmount`.

## Bài tập nhỏ
1. Thêm nút "Chọn toàn bộ" gọi `this.inputRef.current.select()` khi bấm.
2. Đổi `defaultValue` thành controlled `value={this.state.text}` + `onChange` setState, rồi so sánh: khi nào nên dùng cách nào.
3. Thêm một `<textarea ref={this.areaRef}>` và nút "Ghi log độ dài" in `this.areaRef.current.value.length`.
4. Dùng `React.createRef()` cho một `div` và gọi `scrollIntoView()` khi bấm nút — thấy rõ sức mạnh imperative của ref.

## Reference
- https://legacy.reactjs.org/docs/refs-and-the-dom.html
- https://legacy.reactjs.org/docs/uncontrolled-components.html
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/focus