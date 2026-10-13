# 1. Expressions (JSX `{}`)

> ⚠️ LEGACY nhưng JSX vẫn dùng đến nay. Hiện nay nên dùng function components (xem `3_react-tutorial`).
> Đối chiếu AngularJS `1_expressions` (`ng-init` + `{{ }}`).

## Mục tiêu bài học
- Hiểu JSX là gì và vì sao mọi expression trong JSX phải nằm trong cặp `{}`.
- Biết cách "đưa dữ liệu vào giao diện": khởi tạo dữ liệu trong `this.state` (giống `ng-init`) rồi in ra qua `{}`.
- Phân biệt `{{ }}` của AngularJS (template HTML riêng) với `{}` của React (JS thật ngay trong JSX).

## Khái niệm cốt lõi (Core)
- AngularJS: dữ liệu đặt lên `$scope` bằng `ng-init`, template HTML dùng `{{ name }}` để in ra. Khung `{{ }}` là cú pháp riêng của AngularJS (về bản chất là expression parser của Angular).
- React: JSX không phải HTML mà là JS. Bất kỳ biểu thức JS nào muốn xuất ra UI đều đặt trong `{}`: `{this.state.name}`, `{this.state.sort.one}`, hay thậm chí một phép tính `{40 + 2}`. Không có `ng-init` — dữ liệu khởi tạo trong `this.state` (constructor).
- `{}` chấp nhận *mọi biểu thức trả về giá trị* (biến, phép toán, gọi hàm, ternary...), nhưng *không* chấp nhận câu lệnh (`if`, `for`) hay object literal trần (object phải bọc trong dấu ngoặc: `{{a: 1}}`).
- Vì JSX được Babel biên dịch thành `React.createElement(...)`, mọi expression trong `{}` đều *được tính tại thời điểm render*. Đây là khác biệt lớn so với AngularJS: `{{ }}` do Angular "parse lại" trong digest; còn `{}` là JS thật chạy một lần mỗi lần component render.
- Một component có thể in ra **nhiều** `{}` liền nhau, ghép cả chữ tĩnh lẫn biến: `<p>Chào {name}, bạn {count} tuổi</p>` — giống trộn `{{ name }}` với text trong template AngularJS.
- React tự **escape** giá trị trong `{}`: nếu expression là chuỗi `<script>` hay HTML, React in ra dạng text an toàn (không chèn thẻ) — không cần tự lo XSS như khi `ng-bind-html`/nối chuỗi thủ công.

### Keyword chính
`JSX` · `expression` · `this.state` · `constructor` · `ReactDOM.render` · `Babel`.

## Luồng hoạt động (Flow)
1. Mở `index.html` → nạp CDN `react@16`, `react-dom@16`, `babel-standalone@6` (cần internet).
2. Babel biên dịch `example.jsx` (chứa class `ExpressionsDemo`) và dòng `ReactDOM.render(<ExpressionsDemo />, ...)`.
3. `constructor` của `ExpressionsDemo` chạy → khởi tạo `this.state = { name, sort }`.
4. `render()` chạy → các expression `{this.state.name}`, `{this.state.sort.one}`, ... được *tính giá trị* rồi chèn vào cây Virtual DOM.
5. ReactDOM render toàn bộ vào `<div id="root">` trong DOM thật.
6. Nếu có thay đổi state sau này, `render()` chạy lại và mọi `{}` được tính lại — nhưng ở bài này state tĩnh nên chỉ chạy một lần.

**Chạy:** mở `index.html` bằng trình duyệt (CDN React 16 + Babel).
- Lưu ý: nếu mở qua `file://` mà không thấy gì, thường là do CDN bị chặn/mạng — mở lại khi có internet hoặc chạy qua server tĩnh.
- Mở DevTools Console để xem cảnh báo (nếu có) và tab Elements để thấy Virtual DOM đã render thành DOM thật.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu AngularJS ng-init/{{ }}.
class ExpressionsDemo extends React.Component {
  constructor(props) {
    super(props);
    // this.state ↔ ng-init="name='Geeks for Geeks'"
    // Dữ liệu được khai báo MỘT LẦN ở đây, sau đó render ra UI
    this.state = {
      name: "Geeks for Geeks", // ↔ ng-init="name='Geeks for Geeks'"
      sort: { one: "quick sort", two: "merge sort", three: "bubble sort" }
    };
  }
  render() {
    // Mỗi cặp { } là một expression được JS tính rồi chèn vào JSX
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>React Expressions (JSX)</h2>
        <div>
          {/* {name} ↔ {{ name }} của AngularJS */}
          <p>{this.state.name} is a portal for geeks.</p>
        </div>
        <div>
          <p>Sorting Algorithms:</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {/* Truy cập thuộc tính lồng nhau như JS bình thường */}
            <li>{this.state.sort.one}</li>
            <li>{this.state.sort.two}</li>
            <li>{this.state.sort.three}</li>
          </ul>
        </div>
        {/* Biểu thức JS tùy ý trong {}: */}
        <p>{"Tổng: " + (40 + 2)}</p>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`constructor(props)` + `super(props)`**: chạy đầu tiên khi component được khởi tạo; `super(props)` truyền props lên lớp cha để `this` dùng được.
- **`this.state = { name, sort }`**: đây chính là "nguồn dữ liệu" — thay cho `ng-init`. Dữ liệu lồng nhau (`sort.one`) truy cập y như object JS.
- **`{this.state.name}`**: React tính `this.state.name` rồi chèn chuỗi vào đúng vị trí. Khác `{{ }}`: ở đây là code JS thật, trình duyệt/Babel hiểu ngay.
- **`{"Tổng: " + (40 + 2)}`**: minh họa rằng `{}` chỉ là "hộp chứa biểu thức" — bạn có thể viết phép toán, nối chuỗi, ternary... tùy ý.
- **`style={{ textAlign: "center" }}`**: ngoặc ngoài là JSX (mở expression), ngoặc trong là object JS — chính là kiến thức cốt lõi của `{}`.
- **Vì sao `{}` không nhận `if`?**: vì `if` là *câu lệnh* (statement), không trả về giá trị. Muốn rẽ nhánh, dùng toán tử *biểu thức* ternary `{cond ? a : b}` hoặc tính trước một biến trong `render()` rồi in `{bien}`.
- **Chuỗi và số**: `{"Tổng: " + (40 + 2)}` cho ra `"Tổng: 42"`. Nếu chỉ viết `{40 + 2}` React in `42`. Cả hai đều là biểu thức — không cần template filter nào.
- **In object/array**: array các phần tử JSX được React render nối tiếp; object thô KHÔNG render được (báo lỗi "Objects are not valid as a React child") — phải in từng thuộc tính.
- **Comment trong JSX**: không dùng `//` hay `/* */` trực tiếp giữa các thẻ; phải đặt trong `{/* ... */}`. Đây là chi tiết hay bị bỏ sót khi mới chuyển từ HTML template.
- **Boolean/null/undefined**: `{true}`, `{null}`, `{undefined}` đều không in gì — hữu ích khi muốn "ẩn" một giá trị theo điều kiện (`{flag && x}`).

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `{{ name }}` | `{this.state.name}` | Cùng in dữ liệu ra UI |
| `ng-init="name='Geeks'"` | `this.state = { name: "Geeks" }` trong constructor | Khai báo dữ liệu khởi tạo |
| `{{ 40 + 2 }}` | `{40 + 2}` | Epxression đều được phép |
| Template HTML riêng (`*.html`) | JSX trong file `.jsx` | React gộp view vào code |
| Expression parser của Angular | JS thuần (Babel biên dịch) | Không có cú pháp mới nào ngoài `{}` |

## Lỗi thường gặp (Common pitfalls)
- **Đặt text/expression ngoài `{}`**: `{this.state.name}` viết thành `{name}` không có `{}` → in literal "name" hoặc báo lỗi. → Luôn bọc expression trong `{}`.
- **Viết câu lệnh trong `{}`**: `{if (x) {...}}` → Babel báo cú pháp sai. → Dùng ternary `{x ? ... : ...}` hoặc tách ra biến trước.
- **Object literal trần trong `{}`**: `<p style={{color:'red'}}>` bị viết nhầm thành `<p style={color:'red'}>` → lỗi. → Object phải nằm trong cặp ngoặc: `{{...}}`.
- **Quên `super(props)`** → lỗi khi dùng `this.state`. → Luôn gọi `super(props)` đầu constructor.
- **Gán giá trị cho `this.state` sau khi render xong** (ngoài constructor) → React không re-render. → Chỉ khởi tạo state trong constructor, muốn đổi dùng `setState`.
- **`{this.state.sort}` in ra `[object Object]`** — cố in nguyên object thay vì thuộc tính con. → In đúng field: `{this.state.sort.one}`.
- **Dùng backtick template ngay trong `{}` mà không bọc** — `{`a ${b}`}` hợp lệ, nhưng thiếu ngoặc sẽ lỗi. → Đảm bảo chuỗi template nằm trọn trong `{}`.

## Best practices / Mẹo
- Chỉ đặt trong `{}` những gì *cần* tính toán; text tĩnh cứ viết thẳng.
- Tách biến phức tạp ra khỏi JSX (vd `const total = ...` trong `render()` trước `return`) để JSX dễ đọc.
- Tận dụng escape mặc định của React: không nhúng HTML bằng chuỗi trong `{}`; nếu thật sự cần in HTML hãy dùng thư viện khác có kiểm soát (VD `dangerouslySetInnerHTML` — tránh khi chưa hiểu rủi ro).
- Đặt tên state rõ nghĩa (`sort`, `users`) thay vì `data` chung chung.
- Giữ JSX "mỏng": tính toán phức tạp đưa ra ngoài `return` để `{}` chỉ còn in biến.
- Thêm khoảng trắng/câu chữ tĩnh ngay trong JSX thay vì ghép chuỗi — dễ đọc hơn và ít lỗi hơn.
- Đặt `key` khi in mảng bằng `map` (xem bài Lists) — đừng đợi đến khi React cảnh báo.
- Ghi nhớ quy tắc: `{}` = "hộp đựng biểu thức JS", không phải cú pháp của Angular; đọc JSX như đọc JS.

## Bài tập nhỏ
1. Thêm một expression hiển thị tổng số phần tử: `{this.state.sort.one.length}` — giải thích kết quả.
2. Đổi đoạn "Tổng: " thành dùng template string ES6: `{`Tổng: ${40 + 2}`}` và so sánh với cách nối chuỗi cũ.
3. In 3 thuật toán bằng `map` thay vì 3 dòng `<li>` — nối tiếp kiến thức sang bài Lists.

## Reference
- https://legacy.reactjs.org/docs/introducing-jsx.html
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
- https://babeljs.io/docs/ (Babel — biên dịch JSX)