# Conditional Rendering (≈ ng-if / ng-show / ng-hide)

> ⚠️ LEGACY class, pattern còn đúng đến nay. Hiện nay nên dùng function components.
> Đối chiếu AngularJS `ng-if`, `ng-show/ng-hide`, `ng-switch`.

## Mục tiêu bài học
- Render có điều kiện bằng JS thuần trong JSX: `{cond && <X/>}`, `{cond ? <A/> : <B/>}`, ternary, hoặc `switch` trong `render()`.
- Phân biệt rõ **ng-if** (gỡ khỏi DOM/Virtual DOM) và **ng-show** (giữ DOM, ẩn bằng CSS).
- Tránh bẫy `{count && <X/>}` khi `count = 0`.

## Khái niệm cốt lõi (Core)
- AngularJS: `ng-if` **gỡ hẳn element khỏi DOM** khi false; `ng-show`/`ng-hide` **chỉ đổi CSS** (`display`) — element vẫn nằm trong DOM. `ng-switch` chọn một trong nhiều khối theo biến.
- React: không có directive. JSX chỉ là expression — bạn quyết định bằng toán tử JS:
  - `{cond && <X/>}`: nếu `cond` falsy → không render gì (giá trị `false` được React bỏ qua). ↔ `ng-if`.
  - `{cond ? <A/> : <B/>}`: đổi giữa hai nhánh. ↔ `ng-if`/`else`.
  - `style={{display: cond ? "block" : "none"}}` hoặc class ẩn: giữ node trong Virtual DOM, chỉ ẩn CSS. ↔ `ng-show`.
  - `switch` (statement) trước `return`, hoặc object map: ↔ `ng-switch`.
- **Lưu ý kinh điển**: `{count && <X/>}` với `count = 0` sẽ render **số 0** ra màn hình (vì `0` là giá trị hợp lệ của expression). Fix: dùng `count > 0 &&`.
- **Các giá trị "bỏ qua" của JSX**: React không render `null`, `undefined`, `false`, `true` trong `{}`. Nhưng nó **render `0` và `""`** (vì là số/chuỗi hợp lệ) — cạm bẫy hay gặp khi điều kiện là số.
- **`null` vs gỡ node**: `{cond ? <X/> : null}` gỡ `<X>` khỏi cây khi false (giống `ng-if`). Nếu chỉ cần ẩn mà giữ node/state của nó, dùng CSS `display` (giống `ng-show`).

### Keyword chính
`conditional rendering` · `&&` · `ternary` · `switch` · `display none` · `ng-if/ng-show/ng-switch`.

## Luồng hoạt động (Flow)
1. `ConditionalDemo` khởi tạo state `{ loggedIn: false, role: "guest", showBox: true }`.
2. `render()` chạy: tính `roleMsg` bằng `switch (s.role)` (↔ `ng-switch`) → chuẩn bị các cụm JSX điều kiện.
3. `{s.loggedIn ? <p>Chào mừng...</p> : <p>Vui lòng đăng nhập...</p>}` — đúng nhánh được render.
4. `{s.loggedIn && <p>Panel chỉ hiện khi login...</p>}` — `true && <X/>` = `<X/>`; `false && ...` = `false` (React bỏ qua).
5. `.box` có `style={{display: s.showBox ? "block" : "none"}}` — node luôn trong DOM, chỉ ẩn hiện CSS.
6. Bấm các nút/select → `setState` → `render()` chạy lại → cụm điều kiện tính lại → UI cập nhật đúng nhánh.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu ng-if/ng-show.
class ConditionalDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, role: "guest", showBox: true };
    this.toggleLogin = this.toggleLogin.bind(this);
    this.toggleBox = this.toggleBox.bind(this);
    this.setRole = this.setRole.bind(this);
  }
  toggleLogin() { this.setState(function (p) { return { loggedIn: !p.loggedIn }; }); }
  toggleBox() { this.setState(function (p) { return { showBox: !p.showBox }; }); }
  setRole(e) { this.setState({ role: e.target.value }); }
  render() {
    const s = this.state;
    let roleMsg; // ↔ ng-switch: chọn 1 trong nhiều nhánh
    switch (s.role) {
      case "admin": roleMsg = "Bạn là admin."; break;
      case "user": roleMsg = "Bạn là user."; break;
      default: roleMsg = "Bạn là khách.";
    }
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Conditional (≈ ng-if/ng-show)</h2>
        <p><button onClick={this.toggleLogin}>{s.loggedIn ? "Đăng xuất" : "Đăng nhập"}</button></p>
        {/* ↔ ng-if: gỡ hẳn khỏi DOM (Virtual DOM) khi false */}
        {s.loggedIn ? <p>Chào mừng! (ng-if=true)</p> : <p>Vui lòng đăng nhập. (ng-if=false)</p>}
        {/* Dạng rút gọn: true && <X/>; false && ... → false, React bỏ qua */}
        {s.loggedIn && <p>Panel chỉ hiện khi login (dạng {"cond && <X/>"}).</p>}
        <p><button onClick={this.toggleBox}>{s.showBox ? "Ẩn" : "Hiện"} hộp (ng-show)</button></p>
        {/* ↔ ng-show: node luôn trong DOM, chỉ ẩn bằng CSS display */}
        <div style={{ display: s.showBox ? "block" : "none", border: "1px solid #ddd", maxWidth: 300, margin: "0 auto" }}>
          Hộp ng-show: display={s.showBox ? "block" : "none"}
        </div>
        <p>
          <select value={s.role} onChange={this.setRole}>
            <option value="guest">guest</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </p>
        <p>{roleMsg} (≈ ng-switch)</p>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`switch (s.role)` trước `return`**: cách "ng-switch" thuần JS — tính sẵn biến `roleMsg` rồi nhúng `{roleMsg}` vào JSX. Không cần directive, không cần template.
- **`{s.loggedIn ? <A/> : <B/>}`**: hai nhánh loại trừ; conditional render rõ nhất cho "if/else".
- **`{s.loggedIn && <p>...</p>}`**: khi `loggedIn` true, phép `&&` trả `<p>`; khi false trả `false` → React render nothing. Gọn cho "chỉ hiện khi đúng".
- **`style={{ display: ... }}`**: element vẫn được tạo trong Virtual DOM — trạng thái nội bộ của nó (focus, scroll...) giữ nguyên, khác `ng-if` gỡ hẳn. Đúng ngữ nghĩa `ng-show`.
- **Vì sao không dùng `{s.showBox ? <div/> : null}` cho hộp ng-show?**: vì khi null → React gỡ node → mất state trong node; `display:none` mới giữ node. Tùy nhu cầu chọn đúng.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-if="cond"` (gỡ khỏi DOM) | `{cond && <X/>}` hoặc `{cond ? <X/> : null}` | Cùng hủy node khi false |
| `ng-show/ng-hide` (ẩn CSS) | `style={{display: ...}}` hoặc class | Node vẫn trong DOM |
| `ng-switch` | `switch` trong `render()` / object map | Chọn 1 từ nhiều nhánh |
| `ng-if` + `ng-else` (1.5+) | ternary `? :` | Hai nhánh loại trừ |
| Directive kiểm tra trong template | JS thuần kiểm tra trước khi tạo JSX | Không có cú pháp điều kiện mới |

## Lỗi thường gặp (Common pitfalls)
- **`{count && <X/>}` với `count = 0`** → render số `"0"` ra UI. → Viết điều kiện rõ: `count > 0 && <X/>` (hoặc `!!count &&`).
- **Không bọc nhánh nhiều phần tử**: `{cond && <a/><b/>}` → syntax error. → Bọc trong cặp thẻ cha hoặc `<React.Fragment>`.
- **Dùng hiển thị thay vì gỡ (hay ngược lại)**: muốn giữ trạng thái node (vd đang video) thì không nên gỡ bằng ternary-null. → Chọn đúng `display` hay gỡ node theo nhu cầu.
- **Chạy logic nặng ngay trong JSX**: `{...phức tạp... && <X/>}` khó đọc. → Tính trước thành biến trong `render()`.
- **So sánh sai kiểu**: `s.role === 1` khi role là string "1" → sai nhánh. → Dùng `===` và đảm bảo type khớp (như ví dụ role giữ string).
- **Trả về `false`/`null` từ một nhánh JSX** → React bỏ qua, không hiển thị gì (như mong đợi). Nhưng trả về `0` sẽ in ra `0`. → Cẩn thận với điều kiện kiểu số.

## Best practices / Mẹo
- Ưu tiên đọc: `? :` cho if/else rõ, `&&` cho "chỉ khi đúng", `switch`/object map cho đa nhánh.
- Tách nhánh phức tạp thành component con — giống tách template của `ngInclude`.
- Khi điều kiện dựa trên nhiều state, gộp thành "derived boolean" một chỗ: `const canShow = s.loggedIn && !s.blocked;`.
- Tránh lồng ternary sâu (`a ? b : c ? d : e`) — khó đọc; tách biến hoặc dùng `switch`/object map.

## Bài tập nhỏ
1. Thêm state `count` và render `{count > 0 && <p>Có {count} tin nhắn</p>}` — test khi count = 0 để xác nhận không in "0".
2. Đổi hộp ng-show bằng cách toggle class (như bài styling) và so sánh hiệu quả với `display` inline.

## Reference
- https://legacy.reactjs.org/docs/conditional-rendering.html
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND (&&)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch