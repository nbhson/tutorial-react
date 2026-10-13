# Filter / Search (≈ AngularJS `filter:searchText`)

> Đối chiếu `ng-repeat="x in items | filter:q"` trong AngularJS.
> Pattern vẫn đúng đến nay (kể cả hooks).

## Mục tiêu bài học
- Thay thế "filter template" của AngularJS bằng JS thuần: `.filter()` trước `.map()`.
- Xây dựng ô tìm kiếm theo mô hình controlled input (state `query`).
- Tự viết hàm lọc không phân biệt hoa thường — làm chủ quy tắc của mình thay vì dùng filter có sẵn.

## Khái niệm cốt lõi (Core)
- AngularJS: `ng-repeat="x in items | filter:q"` — `filter` là **filter chuỗi trong template**, Angular tự gọi (và tự chạy lại mỗi digest). Có thêm `filter: {name: q}` để lọc theo field.
- React: **không có filter template**. Toàn bộ là JS:
  - Giữ `query` trong state (controlled input): `value={this.state.query}` + `onChange={this.handleQuery}`.
  - Suy ra danh sách hiển thị trong `render()`: `items.filter(predicate)` → `filtered.map(...)`.
  - Ví dụ predicate: `x.name.toLowerCase().indexOf(q) !== -1` — chứa chuỗi tìm kiếm, không phân biệt hoa thường.
- Vì sao "không có filter" lại hay? Lọc là logic thuần túy (pure function) — dễ test, dễ đổi quy tắc (bỏ dấu tiếng Việt, tìm trong nhiều field...), không phụ thuộc cú pháp template.
- **Derived data**: danh sách đã lọc KHÔNG nên lưu vào state. State giữ `items` gốc + `query`; mảng hiển thị được *suy ra* trong `render()`. Làm ngược lại (lưu `visible` vào state rồi tự đồng bộ) dễ tạo state lệch — không còn "một nguồn sự thật".
- **So với `filter` của AngularJS**: `filter:q` chỉ lọc khớp chuỗi con trên mọi field (hành vi ngầm); React bắt bạn viết rõ lọc field nào, quy tắc nào — rõ ràng hơn nhưng cũng tự do hơn.

### Keyword chính
`Array.filter` · `indexOf` · `toLowerCase` · `controlled input` · `derived data` · `filter template`.

## Luồng hoạt động (Flow)
1. `FilterSearchDemo` khởi tạo state `{ query: "", items: [4 thuật toán] }`.
2. `render()`: `q = this.state.query.toLowerCase()` → `visible = items.filter(x => x.name.toLowerCase().indexOf(q) !== -1)`.
3. Render `visible.map(...)` → danh sách đã lọc.
4. Gõ ô tìm kiếm → `handleQuery` → `setState({query})` → render lại → bộ lọc chạy lại với query mới (mỗi ký tự lọc tức thì, giống `filter` + digest).
5. Không có kết quả → `visible.length === 0` → hiện "Không tìm thấy." (empty state).

**Chạy:** mở `index.html`, gõ ô tìm kiếm để lọc.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu AngularJS filter:search.
class FilterSearchDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "", // chuỗi người dùng gõ — "nguồn" của bộ lọc
      items: [
        { id: 1, name: "quick sort" },
        { id: 2, name: "merge sort" },
        { id: 3, name: "bubble sort" },
        { id: 4, name: "insertion sort" }
      ]
    };
    this.handleQuery = this.handleQuery.bind(this);
  }
  handleQuery(e) { this.setState({ query: e.target.value }); } // ↔ ng-model trên ô tìm kiếm
  render() {
    const q = this.state.query.toLowerCase(); // chuẩn hóa KHÔNG phân biệt hoa thường
    // ↔ | filter:query — lọc JS thuần, kết quả là mảng MỚI (không mutate items)
    const visible = this.state.items.filter(function (x) {
      return x.name.toLowerCase().indexOf(q) !== -1; // name CHỨA chuỗi q
    });
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Filter / Search (≈ filter:q)</h2>
        <p><input value={this.state.query} onChange={this.handleQuery} placeholder="Tìm kiếm... (↔ ng-model + filter)" /></p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {visible.map(function (x) { return <li key={x.id}>{x.name}</li>; })}
        </ul>
        {visible.length === 0 && <p>Không tìm thấy.</p>} {/* empty state ↔ filter không có kết quả */}
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`this.state.query`**: người dùng gõ → state đổi (như `$scope.q` do `ng-model`). React không tự đồng bộ — chính `onChange` + `setState` làm việc đó (controlled).
- **`q = this.state.query.toLowerCase()`**: dựng chuẩn một lần trong render (không phải trong vòng lặp) — hiệu quả và dễ đọc.
- **`indexOf(q) !== -1`**: kiểm tra "chuỗi con có xuất hiện" — đúng ngữ nghĩa `filter:q` của AngularJS (khớp chuỗi con, không phải khớp nguyên văn).
- **`.filter()` trả mảng mới**: `this.state.items` không bị đổi — đúng nguyên tắc immutable; `key={x.id}` vẫn ổn.
- **`visible.length === 0 && <p>...`**: khi filter ra rỗng — nếu bỏ qua, UI "im lặng" (AngularJS cũng chỉ render rỗng, bạn phải tự dựng thông báo).
- **`indexOf` thay cho `includes`**: cả hai đều kiểm tra chuỗi con. `includes` dễ đọc hơn nhưng yêu cầu môi trường ES2015+; `indexOf` chạy rộng rãi nên hợp với tài liệu legacy (bản gốc dùng cách này).
- **`visible` là biến cục bộ trong `render()`**: không nằm trong state, không gây thêm render — chỉ là ảnh chụp danh sách đã lọc tại thời điểm render.
- **`key` sau khi lọc**: key vẫn theo `x.id`, không theo vị trí sau lọc — nhờ vậy khi query thay đổi, React giữ đúng phần tử còn lại.
- **So sánh nhiều field**: muốn giống `filter:q` (quét mọi field), dùng `Object.keys(x).some(...)`; muốn chỉ theo `name` thì predicate một field như ví dụ — React cho bạn quyền quyết định.
- **Khớp ở giữa chuỗi**: `"sort"` khớp cả `"quick sort"` lẫn `"merge sort"` — vì `indexOf` tìm chuỗi con ở bất kỳ vị trí, không chỉ đầu chuỗi.
- **`query` rỗng**: `indexOf("")` trả `0` (khác `-1`) → mọi item đều khớp → hiển thị toàn bộ, đúng hành vi người dùng mong đợi khi chưa gõ gì.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-model="q"` trên ô tìm kiếm | `value={state.query}` + `onChange` | Cùng lưu từ khóa |
| `ng-repeat="x in items \| filter:q"` | `items.filter(pred).map(...)` | Lọc bằng hàm thuần |
| `filter: {name: q}` | predicate tùy viết: `x.name...` | Chủ động chọn field |
| Digest tự chạy lại filter | `setState` → re-render → filter lại | Cùng hiệu quả "tự cập nhật" |
| Filter có sẵn (giới hạn tùy chọn) | JS thuần, đổi quy tắc dễ dàng | Cùng khả năng mở rộng |

## Lỗi thường gặp (Common pitfalls)
- **So sánh phân biệt hoa-thường**: gõ "Quick" không khớp "quick sort". → `toLowerCase()` cả hai vế như ví dụ.
- **Mutate `items` khi lọc** (`this.state.items = this.state.items.filter(...)`) → mất dữ liệu gốc, "unfilter" không về được. → Luôn giữ `items` nguyên, lọc ra mảng tạm.
- **Filter rỗng so sánh `=== ""`** không khớp "viết hoa" — đã nói ở trên; ngoài ra `indexOf("") === 0 !== -1` → **query rỗng vẫn trả toàn bộ danh sách** — đúng như người dùng mong đợi.
- **Không xử lý empty state** → lọc không ra gì mà UI trống trơn. → Thêm `visible.length === 0 && ...`.
- **Gõ tiếng Việt có dấu** (`bubble sort` vs `bubble sort`) — `indexOf` khớp ký tự thô; muốn bỏ dấu phải chuẩn hóa (VD `normalize("NFD")`). → Tùy yêu cầu thêm hàm bỏ dấu.
- **Lọc ngay trong `map`** (vừa filter vừa transform trong cùng một vòng) → khó đọc, dễ sai. → Tách `.filter().map()` rõ ràng.
- **Tưởng `filter` chạy một lần rồi lưu** → quên rằng nó chạy lại mỗi render; nếu predicate phụ thuộc state khác thì phải đảm bảo state đó cũng nằm trong điều kiện render. → Giữ luồng một chiều: state → filter → map.

## Best practices / Mẹo
- Lọc là "derived data": không lưu kết quả lọc vào state — tính lại trong `render()` từ `items` + `query` (single source of truth).
- Tách predicate thành hàm (vd `matches(x, q)`) để test độc lập và tái dùng.
- Với danh sách lớn, gom `toLowerCase` vào lúc nhập dữ liệu hoặc dùng debounce — nhưng không làm phức tạp lesson này.
- Trim khoảng trắng từ khóa: `q.trim()` tránh người dùng gõ thừa space không khớp gì.
- Chuẩn hóa cả dấu tiếng Việt nếu app đa ngôn ngữ: `str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` cho tìm kiếm không dấu.
- Xử lý an toàn khi `query` có ký tự đặc biệt regex: vì dùng `indexOf` (không phải regex) nên không cần escape — một lợi thế của `indexOf`.
- Giữ `items` là mảng object có `id` — vừa để lọc, vừa làm `key` khi render.
- Không sửa mảng gốc khi lọc: `filter` trả mảng mới, nên `items` bất biến và có thể lọc lại nhiều lần.

## Bài tập nhỏ
1. Lọc theo nhiều field: tìm trong cả `name` lẫn `category` (thêm field cho items) và thử `filter: {name:q, category:q}` của AngularJS để so sánh.
2. Thêm nút "Xóa từ khóa" set `query = ""` và quan sát danh sách về đầy đủ — nhấn mạnh mảng `items` gốc không đổi.
3. Thêm đếm kết quả: `{visible.length} kết quả` để luyện thêm expression trong JSX.
4. Thêm sắp xếp kết quả theo tên bằng `visible.slice().sort(...)` (không đổi mảng gốc) — kết hợp với lọc.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
- https://docs.angularjs.org/api/ng/filter/filter (đối chiếu `filter:q`)