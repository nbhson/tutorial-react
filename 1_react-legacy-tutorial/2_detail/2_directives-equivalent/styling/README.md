# Styling: className / style (≈ ng-class / ng-style)

> Pattern còn đúng đến nay.
> Đối chiếu AngularJS `ng-class`, `ng-style`, `ng-hide/ng-show` gốc CSS.

## Mục tiêu bài học
- Đổi `class` HTML thành `className` trong JSX và dùng nó động theo state.
- Dịch `ng-class` (object/array form) sang `className` với JS thuần.
- Dịch `ng-style` sang object `style` camelCase của React.

## Khái niệm cốt lõi (Core)

Mục này nói về cách React "dịch" `ng-class`/`ng-style`: không còn directive, mọi class/style đều là chuỗi và object JS bạn tự ghép. Đọc để nắm các quy tắc đổi tên (className, camelCase) và idiom `filter(Boolean)`.

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

Ví von: `ng-class` giống có "người giúp việc" xếp quần jean theo điều kiện (bận hay không, ngày hay tối); trong React bạn tự xếp — mỗi lần render là một lần tự nhìn vào tủ state và quyết định "hôm nay mặc gì".

> **Tóm gọn 1 câu:** `class` thành `className`, key CSS thành camelCase, `ng-class` thành chuỗi JS tự ghép — React đưa bạn quyền quyết định, kèm trách nhiệm tự ghép cho đúng.

### Keyword chính
`className` · `style` object · `camelCase` · `filter(Boolean)` · `template literal` · `ng-class`/`ng-style`.

## Luồng hoạt động (Flow)

Mục này chạy ví dụ ghép class động: state đổi → mảng class lọc falsy → join thành chuỗi → className cập nhật.

1. `StylingDemo` khởi tạo state `{ isActive: false, isError: false, color: "green" }`.
2. Render: `cls = ["box", isActive && "active", isError && "error"].filter(Boolean).join(" ")` → chuỗi class (vd `"box active"`).
3. `<style>` tag trong JSX định nghĩa CSS `.box/.active/.error` cho ví dụ.
4. Bấm "toggle active"/"toggle error" → `setState` → `render()` → `cls` tính lại → `className` đổi → hiệu ứng class đổi màu.
5. Gõ màu vào input (`ng-style`) → `setState({color})` → `style={{color: s.color}}` đổi màu chữ trực tiếp qua inline style.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

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

Bảng này dịch từng form của `ng-class`/`ng-style` sang JS thuần — từ class tĩnh đến mảng class động.

| AngularJS | React | Ghi chú |
|---|---|---|
| `class="box"` tĩnh | `className="box"` | Từ khóa `class` không dùng được trong JSX |
| `ng-class="{active: isActive}"` | `className={isActive ? "active" : ""}` | Ternary cho 1 class đơn giản |
| `ng-class="[a, b]"` | `["a", cond && "b"].filter(Boolean).join(" ")` | Mảng class + lọc falsy |
| `ng-style="{color: c}"` | `style={{color: c}}` | Object camelCase |
| `ng-hide` dùng class/display | tự quản `style.display`/class | React không có directive ẩn |
| CSS thuần | CSS thuần (className) | React không thay CSS |

> **Cách đọc bảng này:** các dòng xếp từ tĩnh (class="box") đến động (mảng class, object style); cột *Ghi chú* nhắc quy tắc đặt tên (`className`, camelCase) áp dụng cho mọi dòng.

> **Tóm gọn 1 câu:** Không còn `ng-class`/`ng-style` — chỉ còn chuỗi `className` và object `style` mà bạn tự dựng bằng JS mỗi lần render.

## Lỗi thường gặp (Common pitfalls)

Lỗi styling phần nhiều là "viết kiểu HTML trong JSX" — mục này gom các cú "phập" đó.

- **Viết `class=` trong JSX** → React cảnh báo và bỏ qua attribute. → Luôn dùng `className`.
- **`style="color: red"` (chuỗi)** → không hoạt động. → `style` phải là **object**: `style={{color:"red"}}`.
- **Key style có gạch ngang** `{'background-color': c}` → React không áp dụng thuộc tính. → Viết camelCase: `backgroundColor`.
- **`className={["a", cond && "b"]}` không filter** → khi cond false xuất hiện chuỗi `"a  b"`? Không — join ra `"a true"` và `"a false"` khi falsy không phải `false` (vd `""`) → chuỗi xấu hoặc class lạ. → Luôn `filter(Boolean)` hoặc dùng ternary.
- **Phụ thuộc class vào state nhưng quên setState** (gán thẳng `this.state.isActive = true`) → UI không đổi. → Đổi state qua `setState`.
- **Style số cho thuộc tính cần đơn vị khác `px`**: `{width: 50}` → React dịch thành `50px`, sai nếu ý là `50%`. → Ghi chuỗi có đơn vị: `{width: "50%"}`.

> **Tóm gọn 1 câu:** Ba quy tắc tránh lỗi style: `className` không phải `class`, `style` là object chứ không phải chuỗi, key CSS viết camelCase — và `filter(Boolean)` luôn đi kèm mảng class động.

## Best practices / Mẹo
- Class động ít (1-2 điều kiện) dùng ternary; nhiều điều kiện dùng mảng + `filter(Boolean)` hoặc thư viện `classnames`.
- Inline style chỉ dùng cho giá trị động nhanh (màu, kích thước); class nên đặt trong CSS.
- Tách CSS vào file `.css` cho dự án lớn — `className` vẫn là cơ chế duy nhất.
- **Tránh tính lại chuỗi class trong mỗi phần tử con**; tính `cls` một lần trong `render()` của component cha.
- Nhóm class tĩnh và class động: để class tĩnh trong chuỗi `"box "` rồi chỉ nối phần động — tránh nhầm.
- Không đặt tên prop `class` (như HTML) — React dùng `className`; còn `style` phải là object với key camelCase (`fontSize`, `backgroundColor`).

## Bài tập nhỏ

Bài số 2 đáng làm: viết lại cùng một class động bằng template literal — so sánh hai cách để chọn cách hợp với mình.

1. Thêm state `size` (px) và set `style={{ fontSize: s.size + "px" }}` từ input range — minh họa style động theo giá trị.
2. Viết lại `cls` bằng template literal: `` `box ${isActive ? "active" : ""} ${isError ? "error" : ""}` `` và so sánh độ đọc hiểu với cách mảng.
3. Thêm class `large` khi `size > 20` bằng cách ghép vào mảng class — luyện kết hợp style và class.
4. Thêm một `<style>` trong `index.html` định nghĩa `.box`, `.active`, `.error`, `.large` rồi bỏ hết inline style — thấy CSS tách khỏi component.

## Reference
- https://legacy.reactjs.org/docs/dom-elements.html (className, style camelCase)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
- https://classnames.dev/ (thư viện hỗ trợ class động)