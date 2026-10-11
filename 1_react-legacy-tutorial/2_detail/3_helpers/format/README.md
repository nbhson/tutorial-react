# Format: date / number / currency bằng Intl (≈ AngularJS filter)

> ⚠️ LEGACY class minh họa; hàm `Intl` là chuẩn JS hiện đại, dùng được mọi nơi.
> Đối chiếu AngularJS `3_filter`: `{{ price | currency }}`, `{{ d | date }}`, `{{ n | number }}`, `{{ s | uppercase }}`.

## Mục tiêu bài học
- Dịch các filter định dạng của AngularJS (`currency`, `date`, `number`, `uppercase`) sang hàm helper JS.
- Dùng `Intl.NumberFormat` / `Intl.DateTimeFormat` — chuẩn quốc tế hóa của JS (không phụ thuộc Angular/React).
- Gọi helper trong JSX để định dạng dữ liệu khi render.

## Khái niệm cốt lõi (Core)
- AngularJS: filter trong template: `{{ price | currency:"₫" }}`, `{{ d | date:"dd/MM/yyyy" }}`, `{{ n | number:2 }}`, `{{ s | uppercase }}`. Angular tự áp dụng mỗi digest.
- React: **không có filter template**. Định dạng = **hàm helper thuần JS** rồi gọi trong JSX: `{formatVND(price)}`.
- Công cụ định dạng chuẩn: **`Intl`** (Intl = Internationalization, built-in của JS):
  - `new Intl.NumberFormat("vi-VN", {style:"currency", currency:"VND"}).format(p)` → `1.250.000 ₫` — thay `| currency`.
  - `new Intl.DateTimeFormat("vi-VN", {day:"2-digit", month:"2-digit", year:"numeric"}).format(d)` → `17/05/2024` — thay `| date`.
  - `new Intl.NumberFormat("vi-VN", {minimumFractionDigits:2}).format(n)` → thay `| number:2`.
  - `s.toUpperCase()` — thay `| uppercase` (JS thuần, không cần Intl).
- Lợi ích: locale-aware (dấu phân cách hàng nghìn, tên tháng tiếng Việt...), không phụ thuộc framework, test dễ.
- **Helper là "filter thay thế"**: bất kỳ filter nào của AngularJS (`currency`, `date`, `number`, `uppercase`, `limitTo`, `json`...) đều dịch được sang hàm JS hoặc `Intl`. Điểm khác: Angular gọi filter trong template bằng `|`; React gọi hàm ngay trong `{}`.
- **Format lúc render**: dữ liệu gốc (số, Date) vẫn nằm nguyên trong state/ props; format chỉ biến đổi *khi hiển thị* — không lưu chuỗi đã format vào state (tránh mất khả năng tính toán lại).

### Keyword chính
`Intl.NumberFormat` · `Intl.DateTimeFormat` · `toLocaleString` · `helper function` · `filter thay thế`.

## Luồng hoạt động (Flow)
1. Định nghĩa hàm helper `formatVND`, `formatDate`, `formatNumber` (module-level, không nằm trong class).
2. `FormatDemo` khởi tạo state `{ price: 1250000, date: new Date(2024,4,17), num: 1234567.891 }`.
3. `render()`: gọi `{formatVND(s.price)}`, `{formatDate(s.date)}`, `{formatNumber(s.num, 2)}`, `{"geeks".toUpperCase()}`.
4. Mỗi expression chạy hàm helper → chuỗi định dạng → chèn vào JSX.
5. Trong ví dụ có phần hiển thị "↔ {{price | currency}}" dạng text để học đối chiếu.
6. Khi state/`props` đổi, mỗi helper chạy lại với giá trị mới — luôn ra chuỗi đúng locale mỗi lần render.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
```jsx
// Helpers thay AngularJS filter — dùng Intl (chuẩn JS, không legacy).
// Currency ↔ {{ price | currency:"₫" }}
function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
// Date ↔ {{ d | date:"dd/MM/yyyy" }}
function formatDate(d) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
// Number ↔ {{ n | number:2 }}
function formatNumber(n, digits) {
  return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 }).format(n);
}

class FormatDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { price: 1250000, date: new Date(2024, 4, 17), num: 1234567.891 };
  }
  render() {
    const s = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Format helpers (≈ filter)</h2>
        { /* Gọi helper ngay trong JSX — không cần template */ }
        <p>currency: {formatVND(s.price)} <i>(↔ {"{{price | currency}}"})</i></p>
        <p>date: {formatDate(s.date)} <i>(↔ {"{{d | date}}"})</i></p>
        <p>number(2): {formatNumber(s.num, 2)} <i>(↔ {"{{n | number:2}}"})</i></p>
        <p>uppercase: {"geeks".toUpperCase()} <i>(↔ {"{{s | uppercase}}"})</i></p>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`Intl.NumberFormat("vi-VN", {style:"currency", currency:"VND"})`**: locale `vi-VN` quyết định dấu `.` phân cách nghìn; `currency: "VND"` đưa hậu tố `₫` và đúng tỷ lệ (0 số lẻ). ↔ `| currency`.
- **`minimumFractionDigits` / `maximumFractionDigits`**: ép đúng 2 chữ số thập phân (↔ `| number:2`). Nếu `digits` thay đổi, dùng `digits || 0` để đảm bảo số.
- **`formatNumber` nhận tham số**: cho thấy "filter có đối số" (như `number:2`) trở thành "hàm có tham số" — tự nhiên hơn khi nhiều tùy chọn.
- **`"" .toUpperCase()`**: chuỗi rỗng vẫn chạy an toàn; `uppercase` của Angular chỉ đơn giản gọi `toUpperCase`.
- **`Intl.DateTimeFormat` với `day/month/year: "2-digit"`**: tách trường ngày để có định dạng `dd/MM/yyyy` ≈ `| date:"dd/MM/yyyy"`.
- **`s.toUpperCase()`**: hàm có sẵn của String — filter `uppercase` chỉ là wrapper của nó trong Angular.
- **Vì sao là hàm helper module-level?**: tái dùng ở mọi component, test trực tiếp không cần render React — giống việc tách filter AngularJS.
- **Không cache đối tượng `Intl`?**: với vài lần format mỗi render thì không đáng lo; với danh sách hàng nghìn dòng, tạo `new Intl.NumberFormat(...)` một lần ngoài hàm rồi tái dùng sẽ nhanh hơn.
- **Vì sao nhét `{"{{price | currency}}"}` trong ngoặc**: chuỗi chứa `{{ }}` (cú pháp AngularJS) chỉ để hiển thị ví dụ; trong JSX phải bọc trong `{ }` để React in đúng chuỗi, không bị hiểu là code.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS filter | JS/React (Intl) | Ghi chú |
|---|---|---|
| `{{ p \| currency:"₫" }}` | `new Intl.NumberFormat("vi-VN", {style:"currency", currency:"VND"}).format(p)` | Định dạng theo locale |
| `{{ d \| date:"dd/MM/yyyy" }}` | `new Intl.DateTimeFormat("vi-VN", {day:"2-digit", month:"2-digit", year:"numeric"}).format(d)` | Tùy chỉnh từng trường |
| `{{ n \| number:2 }}` | `new Intl.NumberFormat("vi-VN", {minimumFractionDigits:2}).format(n)` | Ép số thập phân |
| `{{ s \| uppercase }}` | `s.toUpperCase()` | JS thuần |
| Filter trong template | Gọi hàm trong JSX | Không có cú pháp `\|` |

## Lỗi thường gặp (Common pitfalls)
- **Nhầm `Intl` parse lại object**: `format` nhận số/Date — truyền chuỗi `"1250000"` vẫn chạy nhưng ngầm ép kiểu; truyền sai kiểu có thể ra NaN. → Đảm bảo đúng kiểu dữ liệu.
- **Quên locale**: `Intl.NumberFormat()` (không đối số) dùng locale mặc định — kết quả không ổn định giữa máy. → Ghi rõ `"vi-VN"`.
- **Cộng chuỗi trước khi format**: `"Giá: " + price` → mất định dạng. → Format trước: `formatVND(price)` rồi nối.
- **Cho rằng helper phải nằm trong class** → phụ thuộc instance, khó test. → Định nghĩa module-level (hoặc file `format.js`).
- **Dùng `toFixed(2)` cho tiền tệ** → không có dấu phân cách nghìn, sai locale. → Dùng `Intl.NumberFormat` (cách chuẩn).
- **Format trong `constructor`/state** rồi lưu chuỗi** → mất số gốc để tính toán lại, đổi locale không được. → Format mỗi lần render, giữ dữ liệu gốc.

## Best practices / Mẹo
- Gom helpers vào file riêng (`format.js`) — như `filter.js` của Angular — import dùng chung.
- Helper **pure**: cùng input → cùng output, không đụng state → test dễ (xem bài 3_unit-test với `formatVND`).
- `Intl` dùng được cả ở browser lẫn Node — hợp cho SSR, không phụ thuộc framework.
- Đặt tên helper rõ ràng (`formatVND`, `formatDate`) để đọc JSX biết ngay đang định dạng gì.
- Nếu cần format nhiều lần, cache đối tượng `Intl.*` ở module-level rồi tái dùng (tối ưu nhỏ, đáng kể với list dài).
- Test helper độc lập (xem bài Unit Test với `formatVND`) — không cần dựng React.
- Đặt helper trong `format.js` rồi `export` để import ở nhiều component, tránh trùng lặp.
- Luôn truyền locale rõ ràng (`"vi-VN"`, `"en-US"`) thay vì phụ thuộc mặc định của môi trường — kết quả ổn định giữa các máy.

## Bài tập nhỏ
1. Thêm helper `formatPercent` (Intl với `style:"percent"`) và hiển thị `0.1234` → `12,34%`.
2. Khởi tạo `date` bằng `new Date()` hiện tại và định dạng thêm giờ: `hour/minute/second` — so sánh với `{{d | date:"HH:mm:ss"}}`.
3. Thêm nút đổi ngôn ngữ hiển thị (`en-US` ↔ `vi-VN`) lưu locale trong state, truyền vào helper — minh họa "locale-aware".
4. Viết `formatVNDShort` rút gọn (1.500.000 → "1,5 triệu") bằng cách chia bậc và nối chuỗi — luyện logic thuần JS.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- https://docs.angularjs.org/api/ng/filter (đối chiếu filter AngularJS)