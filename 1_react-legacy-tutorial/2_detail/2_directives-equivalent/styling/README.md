# Styling: className / style (≈ ng-class / ng-style)

> Pattern còn đúng đến nay.
> Đối chiếu AngularJS `ng-class`, `ng-style`, `ng-hide/ng-show` gốc CSS.

## Mục tiêu bài học
- Đổi `class` HTML thành `className` trong JSX và dùng nó động theo state.
- Dịch `ng-class` (object/array form) sang `className` với JS thuần.
- Dịch `ng-style` sang object `style` camelCase của React.

## Khái niệm cốt lõi (Core)
- AngularJS:
  - `ng-class="{active: isActive}"` — object: key = class, value = boolean.
  - `ng-class="[a, b]"` — array các class.
  - `ng-style="{color: c}"` — object style động, key theo CSS thường.
- React: JSX không có `class` (vì `class` là từ khóa JS) → dùng **`className`**. Giá trị là **expression**:
  - `ng-class="{active: isActive}"` → `className={isActive ? "active" : ""}` (đơn giản) hoặc nối chuỗi/template literal.
  - `ng-class="[a, b]"` → `className={["a", cond && "b"].filter(Boolean).join(" ")}` — lọc falsy rồi nối.
  - `ng-style="{color: c}"` → `style={{color: c}}` — object camelCase: `backgroundColor`, `fontSize` (không có dấu gạch ngang).
- **Giá trị style số**: React tự thêm đơn vị `px` cho các thuộc tính kích thước (trừ những thuộc tính unitless như `opacity`, `flex`, `zIndex`). Vì vậy `style={{padding: 12}}` tương đương `padding: 12px`. Với giá trị cần đơn vị khác, ghi rõ chuỗi: `style={{width: "50%"}}`.
- **`class` không dùng được**: vì JSX là JS, `class` là từ khóa → dùng `className`. Tương tự `for` → `htmlFor` (trên `<label>`).
- **`className` là chuỗi**: không nhận object/mảng trực tiếp như `ng-class`; bạn phải tự tạo chuỗi bằng JS (ternary, mảng + `join`).
- Ký hiệu `{{}}` trong `style={{color: c}}`: ngoặc ngoài mở expression JSX, ngoặc trong là object JS — đừng nhầm với `{{ }}` của AngularJS.

### Keyword chính
`className` · `style` object · `camelCase` · `filter(Boolean)` · `template literal` · `ng-class`/`ng-style`.

## Luồng hoạt động (Flow)
1. `StylingDemo` khởi tạo state `{ isActive: false, isError: false, color: "green" }`.
2. Render: `cls = ["box", isActive && "active", isError && "error"].filter(Boolean).join(" ")` → chuỗi class (vd `"box active"`).
3. `<style>` tag trong JSX định nghĩa CSS `.box/.active/.error` cho ví dụ.
4. Bấm "toggle active"/"toggle error" → `setState` → `render()` → `cls` tính lại → `className` đổi → hiệu ứng class đổi màu.
5. Gõ màu vào input (`ng-style`) → `setState({color})` → `style={{color: s.color}}` đổi màu chữ trực tiếp qua inline style.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu ng-class/ng-style.
class StylingDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isActive: false, isError: false, color: "green" };
    this.toggleActive = this.toggleActive.bind(this);
    this.toggleError = this.toggleError.bind(this);
    this.setColor = this.setColor.bind(this);
  }
  toggleActive() { this.setState(function (p) { return { isActive: !p.isActive }; }); }
  toggleError() { this.setState(function (p) { return { isError: !p.isError }; }); }
  setColor(e) { this.setState({ color: e.target.value }); }
  render() {
    const s = this.state;
    // ↔ ng-class="{active: isActive, error: isError}"
    // filter(Boolean) bỏ phần tử false/null/"" rồi join thành chuỗi class
    const cls = ["box", s.isActive && "active", s.isError && "error"].filter(Boolean).join(" ");
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Styling (≈ ng-class/ng-style)</h2>
        <style>{".box{border:1px solid #ddd;padding:12px;max-width:320px;margin:0 auto}.active{background:#e8f5e9}.error{border-color:red}"}</style>
        <p>
          <button onClick={this.toggleActive}>toggle active</button>{" "}
          <button onClick={this.toggleError}>toggle error</button>{" "}
          <input value={s.color} onChange={this.setColor} placeholder="màu (ng-style)" />
        </p>
        {/* ↔ ng-class + ng-style: className từ state, style object từ state */}
        <div className={cls} style={{ color: s.color }}>
          className="{cls}" — style color {s.color}
        </div>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`["box", s.isActive && "active", s.isError && "error"]`**: mảng bắt chước form array của `ng-class`. Khi cờ false, phần tử là `false` → `filter(Boolean)` loại bỏ → `join(" ")` ra chuỗi sạch không thừa space.
- **`className={cls}`**: khác hẳn `class="box"` tĩnh — giá trị là expression, tính lại mỗi render. State là "nguồn" quyết định class.
- **`style={{ color: s.color }}`**: object style inline; key `color` giữ nguyên vì 1 từ, nhưng `background-color` phải là `backgroundColor` (camelCase). Giá trị số cần đơn vị (vd `{padding: 12}` → React thêm `px`, nhưng để rõ vẫn nên ghi `"12px"`).
- **`<style>{".box{...}"}</style>`**: nhét CSS string qua JSX — chỉ để demo; trong thực tế CSS nên ở file riêng.
- **`s.active` đổi → render → `cls` đổi**: không có "class binding" ma thuật — React chỉ nhận chuỗi `className` mới và cập nhật attribute.
- **Object style dùng chung key với CSS**: `fontSize`, `backgroundColor`... đều là tên JS camelCase; tra trong tài liệu React DOM Elements khi không chắc.
- **Nhiều class từ state**: gộp qua mảng/`filter(Boolean)` để tránh chuỗi thừa dấu cách; React không tự "chuẩn hóa" chuỗi `className`.
- **Style ưu tiên hơn class**: inline style có độ ưu tiên cao hơn CSS class — cẩn thận khi vừa set class vừa set style cùng thuộc tính.
- **Vì sao `filter(Boolean)`?**: `s.isActive && "active"` trả `false` khi `isActive` false; `[..., false, ...].join(" ")` sẽ in ra `"false"`! `filter(Boolean)` loại bỏ mọi giá trị falsy trước khi join. Đây là idiom rất phổ biến khi làm class động.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React | Ghi chú |
|---|---|---|
| `class="box"` tĩnh | `className="box"` | Từ khóa `class` không dùng được trong JSX |
| `ng-class="{active: isActive}"` | `className={isActive ? "active" : ""}` | Ternary cho 1 class đơn giản |
| `ng-class="[a, b]"` | `["a", cond && "b"].filter(Boolean).join(" ")` | Mảng class + lọc falsy |
| `ng-style="{color: c}"` | `style={{color: c}}` | Object camelCase |
| `ng-hide` dùng class/display | tự quản `style.display`/class | React không có directive ẩn |
| CSS thuần | CSS thuần (className) | React không thay CSS |

## Lỗi thường gặp (Common pitfalls)
- **Viết `class=` trong JSX** → React cảnh báo và bỏ qua attribute. → Luôn dùng `className`.
- **`style="color: red"` (chuỗi)** → không hoạt động. → `style` phải là **object**: `style={{color:"red"}}`.
- **Key style có gạch ngang** `{'background-color': c}` → React không áp dụng thuộc tính. → Viết camelCase: `backgroundColor`.
- **`className={["a", cond && "b"]}` không filter** → khi cond false xuất hiện chuỗi `"a  b"`? Không — join ra `"a true"` và `"a false"` khi falsy không phải `false` (vd `""`) → chuỗi xấu hoặc class lạ. → Luôn `filter(Boolean)` hoặc dùng ternary.
- **Phụ thuộc class vào state nhưng quên setState** (gán thẳng `this.state.isActive = true`) → UI không đổi. → Đổi state qua `setState`.
- **Style số cho thuộc tính cần đơn vị khác `px`**: `{width: 50}` → React dịch thành `50px`, sai nếu ý là `50%`. → Ghi chuỗi có đơn vị: `{width: "50%"}`.

## Best practices / Mẹo
- Class động ít (1-2 điều kiện) dùng ternary; nhiều điều kiện dùng mảng + `filter(Boolean)` hoặc thư viện `classnames`.
- Inline style chỉ dùng cho giá trị động nhanh (màu, kích thước); class nên đặt trong CSS.
- Tách CSS vào file `.css` cho dự án lớn — `className` vẫn là cơ chế duy nhất.
- **Tránh tính lại chuỗi class trong mỗi phần tử con**; tính `cls` một lần trong `render()` của component cha.
- Nhóm class tĩnh và class động: để class tĩnh trong chuỗi `"box "` rồi chỉ nối phần động — tránh nhầm.
- Không đặt tên prop `class` (như HTML) — React dùng `className`; còn `style` phải là object với key camelCase (`fontSize`, `backgroundColor`).

## Bài tập nhỏ
1. Thêm state `size` (px) và set `style={{ fontSize: s.size + "px" }}` từ input range — minh họa style động theo giá trị.
2. Viết lại `cls` bằng template literal: `` `box ${isActive ? "active" : ""} ${isError ? "error" : ""}` `` và so sánh độ đọc hiểu với cách mảng.
3. Thêm class `large` khi `size > 20` bằng cách ghép vào mảng class — luyện kết hợp style và class.
4. Thêm một `<style>` trong `index.html` định nghĩa `.box`, `.active`, `.error`, `.large` rồi bỏ hết inline style — thấy CSS tách khỏi component.

## Reference
- https://legacy.reactjs.org/docs/dom-elements.html (className, style camelCase)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
- https://classnames.dev/ (thư viện hỗ trợ class động)