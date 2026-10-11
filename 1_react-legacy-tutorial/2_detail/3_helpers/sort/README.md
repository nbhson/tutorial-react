# Sort (≈ AngularJS `orderBy`)

> Đối chiếu `ng-repeat="x in items | orderBy:'name'"` trong AngularJS.
> Pattern vẫn đúng đến nay.

## Mục tiêu bài học
- Thay `orderBy` bằng `Array.sort()` trên **bản sao** mảng — không mutate state.
- Quản lý cột sắp xếp và chiều bằng state `sortKey` + `sortDir`; bấm lại cùng cột để đảo chiều (↔ `orderBy` + dấu `-`).
- Xử lý chuỗi tiếng Việt đúng thứ tự bằng `localeCompare("vi")`.

## Khái niệm cốt lõi (Core)
- AngularJS: `ng-repeat="x in items | orderBy:'name'"` — Angular sort ngay trong template; chiều giảm = prefix `-`: `orderBy:'-name'`.
- React: không có template filter — sắp xếp bằng JS trong `render()`:
  1. **Copy mảng**: `items.slice()` — vì `Array.sort()` sắp xếp **tại chỗ (mutate)**; gọi trực tiếp lên `this.state.items` sẽ đổi state → vi phạm immutable.
  2. Sort với comparator: `(a, b) => a[key] > b[key] ? 1 : -1` (tăng) hoặc `-` kết quả (giảm).
  3. Chiều asc/desc do state `sortDir` quyết định; cột do `sortKey`.
- Chuỗi tiếng Việt: so sánh `>` theo mã Unicode có thể sai thứ tự từ điển (vd "Đà" vs "Bình"). Dùng **`localeCompare("vi")`** cho đúng bảng chữ cái.
- State `sortKey`/`sortDir` là ví dụ điển hình của "derived state": dữ liệu hiển thị `sorted` được **suy ra** từ `items` + cấu hình sort, không lưu riêng.

### Keyword chính
`sort()` · `slice()` · `immutable` · `comparator` · `localeCompare` · `sortKey/sortDir` · `orderBy`.

## Luồng hoạt động (Flow)
1. `SortDemo` khởi tạo `{ sortKey: "name", sortDir: "asc", items: [3 thuật toán] }`.
2. Bấm tiêu đề cột → `sortBy(key)` → nếu cùng cột đang `asc` thì đảo `desc`, ngược lại set `asc`; cập nhật `sortKey` + `sortDir`.
3. `render()`: `sorted = items.slice().sort(comparator)` — copy → so sánh theo `sortKey`/`sortDir` (string dùng `localeCompare("vi")`, số dùng `>`).
4. Render `sorted.map(...)` thành các hàng `<tr>`; mũi tên `▲/▼` hiển thị theo `sortKey` + `sortDir`.
5. Mỗi khi sortKey/sortDir/items đổi → render lại → danh sách được sắp xếp mới.

**Chạy:** mở `index.html`, bấm tiêu đề cột để đổi thứ tự.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu AngularJS orderBy.
class SortDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: "name",
      sortDir: "asc",
      items: [
        { id: 1, name: "Merge sort", price: 300 },
        { id: 2, name: "Quick sort", price: 100 },
        { id: 3, name: "Bubble sort", price: 200 }
      ]
    };
    this.sortBy = this.sortBy.bind(this);
  }
  sortBy(key) {
    this.setState(function (prev) {
      // bấm lại cùng cột → đảo chiều (↔ orderBy toggle: 'name' ↔ '-name')
      const dir = prev.sortKey === key && prev.sortDir === "asc" ? "desc" : "asc";
      return { sortKey: key, sortDir: dir };
    });
  }
  render() {
    const key = this.state.sortKey, dir = this.state.sortDir;
    // slice() tạo BẢN SAO trước khi sort (sort mutate tại chỗ) — giữ state nguyên vẹn
    const sorted = this.state.items.slice().sort(function (a, b) {
      let r;
      // string → localeCompare("vi") cho đúng thứ tự tiếng Việt và không phân biệt hoa thường
      if (typeof a[key] === "string") r = a[key].localeCompare(b[key], "vi");
      else r = a[key] > b[key] ? 1 : -1; // number → so sánh thường
      return dir === "asc" ? r : -r;     // asc giữ nguyên, desc đảo dấu
    });
    // Mũi tên chỉ cột đang sort: ▲ asc / ▼ desc
    const arrow = function (k) { return key === k ? (dir === "asc" ? " ▲" : " ▼") : ""; };
    const self = this;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Sort (≈ orderBy)</h2>
        <table border="1" cellPadding="8" style={{ margin: "0 auto" }}>
          <thead>
            <tr>
              <th><button onClick={function () { self.sortBy("name"); }}>Tên{arrow("name")}</button></th>
              <th><button onClick={function () { self.sortBy("price"); }}>Giá{arrow("price")}</button></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(function (x) {
              return <tr key={x.id}><td>{x.name}</td><td>{x.price}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`this.state.items.slice().sort(...)`**: `slice()` (không đối số) nhân bản mảng — sort trên bản sao, `items` gốc không đổi. Đây là điểm khác biệt quan trọng nhất so với `orderBy` (Angular tự lo copy).
- **Comparator**: với string dùng `localeCompare("vi")` — sắp đúng bảng chữ cái tiếng Việt và không phân biệt hoa thường (khác `>` so theo Unicode). Với number dùng `a[key] > b[key] ? 1 : -1`.
- **`dir === "asc" ? r : -r`**: đảo dấu comparator đảo chiều sắp xếp — tương đương `orderBy:'-name'`.
- **`sortBy` đổi state**: UI chỉ "biết" cột/chiều qua state; render tính lại `sorted` từ đó. Không lưu mảng `sorted` vào state — tránh hai nguồn sự thật.
- **`function(){ self.sortBy("name"); }`**: closure để truyền tham số cột vào handler — vì `onClick={this.sortBy}` không tự truyền key.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `\| orderBy:'name'` | `items.slice().sort(comparator)` | JS thuần thay vì template |
| `orderBy:'-name'` (giảm) | `-r` khi `sortDir==="desc"` | Đảo dấu comparator |
| `orderBy` tự bảo toàn mảng | Phải tự `slice()` copy | Sort mutate tại chỗ — tự lo |
| Sort so theo Unicode | `localeCompare("vi")` | Đúng thứ tự tiếng Việt |
| Không có khái niệm cột state | state `sortKey` + `sortDir` | Chủ động quản lý UI |

## Lỗi thường gặp (Common pitfalls)
- **Gọi `items.sort()` trực tiếp trên state** → mảng state bị mutate → re-render dữ liệu gốc đã đổi, "unsort" không về được. → Luôn `slice()` trước.
- **So sánh chuỗi bằng `>`** → "Đà Nẵng" đứng trước "Bình" sai thứ tự; phân biệt hoa thường. → `localeCompare("vi", {sensitivity:"base"})` nếu cần.
- **Comparator trả về sai dấu** (0 cho phần tử bằng nhau bị bỏ qua) → thứ tự không ổn định với mảng lớn. → Trả `1 / -1` như ví dụ (hoặc dùng `a[key].localeCompare(...)` vốn đã trả đúng dấu).
- **Lưu `sorted` vào state** → thêm bước setState thừa, dễ lệch khi items đổi. → Tính mỗi lần render từ nguồn gốc.
- **Không dùng key trong tbody map** → cảnh báo + diff sai. → `key={x.id}` trên `<tr>`.

## Best practices / Mẹo
- Nhớ: sort = copy → sort → (filter nếu có) → map. Giữ thứ tự pipeline rõ ràng.
- Tách comparator thành hàm riêng (`compare(key, dir)`) để đổi luật (nullable, nhiều cột) mà không đụng render.
- Dùng `localeCompare` với option `{sensitivity:"base"}` nếu muốn bỏ qua dấu tiếng Việt khi tìm/so.

## Bài tập nhỏ
1. Thêm cột "Độ khó" (string như "dễ/trung bình/khó") và sắp xếp theo nó — dùng `localeCompare` và quan sát thứ tự.
2. Sắp xếp **kết hợp filter** (lấy từ bài filter-search): lọc `query` rồi sort kết quả, mô phỏng `ng-repeat="x in items | filter:q | orderBy:'name'"`.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
- https://docs.angularjs.org/api/ng/filter/orderBy (đối chiếu orderBy)