# Lists với map (≈ ng-repeat)

> Pattern `map` + `key` vẫn đúng đến nay (kể cả hooks).
> Đối chiếu chi tiết `ng-repeat` của AngularJS: `$index`, `$first`, `$last`, `track by`, empty state.

## Mục tiêu bài học
- Dịch một `ng-repeat` bất kỳ sang `Array.prototype.map` trong JSX.
- Dùng các "magic variable" của ng-repeat (`$index`, `$first`, `$last`) bằng tham số của hàm map.
- Thêm empty state khi danh sách rỗng (↔ giao diện khi `ng-repeat` không có phần tử).

## Khái niệm cốt lõi (Core)
- AngularJS: `ng-repeat="x in items"` duyệt mảng, nhân bản template; cung cấp sẵn biến đặc biệt `$index`, `$first`, `$last`, `$even`, `$odd`; `track by` cho biết cách theo dõi phần tử.
- React: `items.map(x => <li key={x.id}>...)` — map là hàm JS thường:
  - Phần tử hiện tại: tham số 1 (`x`).
  - **Chỉ mục/`$index`**: tham số 2: `map((x, i) => ...)`.
  - `$first` = `i === 0`; `$last` = `i === items.length - 1` — tự suy bằng so sánh.
- **key** (↔ `track by`): định danh ổn định cho React diff. Xem bài `11_lists-keys` để hiểu sâu.
- **Map trả về mảng JSX**: React render một mảng các phần tử bằng cách "trải" từng phần tử vào vị trí. Vì vậy `{items.map(...)}` là cách chuẩn — không có "template loop" nào khác.
- **`map` là hàm bất biến**: nó trả về mảng MỚI, không đổi mảng gốc — phù hợp với nguyên tắc state trong React (không mutate). So với `ng-repeat`, bạn kiểm soát hoàn toàn phép biến đổi.
- **Không giới hạn ở `<li>`**: map có thể render `<tr>`, `<option>`, `<div>`, component tùy biến... miễn `key` đặt trên node gốc mỗi item.
- `ng-repeat` kèm `filter:` trong template → trong React: `.filter()` trước `.map()` (xem bài `filter-search`).

### Keyword chính
`Array.map` · `key` · `$index` ↔ tham số index · `$first/$last` ↔ so sánh index · `track by` ↔ `key`.

## Luồng hoạt động (Flow)
1. `ListsMapDemo` khởi tạo state `{ users: [An, Bình, Chi] }` (mỗi user có `id` ổn định).
2. `render()`: call `users.map(function (u, i) {...})` → duyệt mảng, với mỗi user tạo `<li key={u.id}>`.
3. Với từng phần tử: tính `tag = i === 0 ? " ($first)" : (i === users.length - 1 ? " ($last)" : "")` → gắn vào text.
4. `{users.length === 0 && <p>Danh sách trống.</p>}` — empty state.
5. React nhận mảng JSX → render danh sách; `key={u.id}` giúp diff đúng phần tử.
6. Nếu list rỗng → `users.map` trả `[]` (React render nothing) → nhánh `length === 0` mới hiện "Danh sách trống.".

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu ng-repeat chi tiết ($index/$first/$last).
class ListsMapDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [
        { id: 1, name: "An" },
        { id: 2, name: "Bình" },
        { id: 3, name: "Chi" }
      ]
    };
  }
  render() {
    const users = this.state.users; // lấy mảng dữ liệu
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Lists map (≈ ng-repeat)</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map(function (u, i) {
            // i ↔ $index; $first ↔ i===0; $last ↔ i===length-1
            const tag = i === 0 ? " ($first)" : (i === users.length - 1 ? " ($last)" : "");
            return <li key={u.id}>#{$index = i} — {u.name}{tag}</li>;
          })}
        </ul>
        {/* Empty state ↔ ng-repeat không có phần tử */}
        {users.length === 0 && <p>Danh sách trống.</p>}
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`users.map(function (u, i) {...})`**: `u` = phần tử, `i` = vị trí (0-based). Không có biến "ma thuật" — React dùng tham số hàm, rõ ràng hơn `$index`.
- **`i === 0` / `i === users.length - 1`**: tự suy `$first`/`$last`; muốn `$even`/`$odd` thì `i % 2`.
- **`key={u.id}`**: bắt buộc cho mảng JSX; dùng id dữ liệu, không dùng `i` khi danh sách đổi thứ tự.
- **`#{$index = i}` trong ví dụ**: biểu thức trong `{}` in ra giá trị `i`; thực tế chỉ nên viết `#{i}` (giữ đúng bản gốc minh họa để đối chiếu tên `$index`).
- **Lọc trước, map sau**: pipeline chuẩn là `data.filter(...).map(...)` — thứ tự quan trọng, lọc giảm số phần tử trước khi tạo JSX.
- **Index sau khi lọc**: nếu cần `$index` theo danh sách đã lọc, dùng tham số 2 của `map` sau khi lọc — đúng "vị trí hiển thị".
- **Không nhân bản template**: mỗi lần "lặp" là một biểu thức JS; nhờ vậy có thể nhúng logic điều kiện ngay trong từng item.
- **`{users.length === 0 && <p>Danh sách trống.</p>}`**: ng-repeat rỗng không có gì hiển thị; bạn phải tự thêm empty state (AngularJS không làm điều này tự động).
- **Return trong map phải trả JSX**; nếu không `return` thì mảng toàn `undefined`. Đó cũng là lỗi hay gặp.
- **Không có "ng-repeat-start/end"**: muốn lặp ra nhiều nhóm phần tử, map trả về một mảng (dùng `<React.Fragment key=...>` bao ngoài) — không có directive ghép cặp như AngularJS.
- **Số phần tử đổi → React diff theo key**: thêm/xóa/sắp xếp đều dựa trên `key`, không phải vị trí — đây là chỗ khác biệt rõ nhất so với việc AngularJS nhân bản DOM theo template.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React | Ghi chú |
|---|---|---|
| `ng-repeat="x in items"` | `items.map(x => <li key={x.id}>)` | Cùng duyệt mảng render list |
| `track by x.id` | `key={x.id}` | Định danh phần tử cho diff |
| `$index` | `map((x, i) => ...)` — `i` | Tham số hàm thay vì magic var |
| `$first` | `i === 0` | So sánh bằng JS |
| `$last` | `i === items.length - 1` | So sánh bằng JS |
| `filter:q` trong repeat | `.filter()` trước `.map()` | Xử lý rõ ràng từng bước |
| Repeat rỗng → không gì hiện | Tự thêm `{list.length === 0 && ...}` | Chủ động thêm empty state |

## Lỗi thường gặp (Common pitfalls)
- **Quên `return` trong callback map** → mảng `<li>` toàn `undefined`, danh sách rỗng. → Luôn `return` JSX (hoặc dùng arrow expression).
- **Dùng `index` làm key khi list đổi thứ tự/thêm-xóa** → state/DOM lệch (xem bài 11). → Dùng id ổn định.
- **Muốn `$index` nhưng viết `map(x)`** → không có chỉ mục. → Nhận tham số 2: `.map((x, i) => ...)`.
- **Mutate mảng trước khi map** (`push` trên `this.state.users`) → React không thấy đổi (tham chiếu cũ). → Tạo mảng mới (`concat`, `filter`, `slice`).
- **Không có empty state** → lúc rỗng list "biến mất" lặng lẽ, người dùng không hiểu. → Thêm nhánh `length === 0`.
- **Trả về cả một thẻ chứa nhiều `<li>` sai cấu trúc** → thẻ HTML ngữ nghĩa sai. → Map phải trả về đúng phần tử danh sách (`<li key=...>`) đặt trong thẻ cha (`<ul>`).
- **Dùng `map` mà không gắn key trên node gốc mỗi item** → React không phân biệt được các node, cảnh báo + diff sai. → `key` đặt trên phần tử ngoài cùng do map trả về.

## Best practices / Mẹo
- Luôn render mảng từ một nguồn sạch: tính `visible = data.filter(...)` trước, rồi `visible.map(...)` — dễ đọc, dễ test.
- Nếu phần tử map phức tạp, tách component `<UserRow user={u} />` và đặt `key` ở node nó render (giống directive con trong ng-repeat).
- Giữ key ổn định xuyên suốt vòng đời dữ liệu (id từ server là chuẩn nhất).
- Có thể tính trước `const lastIndex = users.length - 1;` để điều kiện `$last` gọn hơn.
- Với dữ liệu từ server, luôn dùng id tự nhiên làm key; nếu không có, sinh id ổn định (không phải index).
- Kết hợp `map` với `filter` để thay `ng-repeat` + `ng-if`/`limitTo`, nhưng nhớ tách bước lọc ra trước khi map để JSX gọn.

## Bài tập nhỏ
1. Thêm cột `$even/$odd` (đổi màu nền dòng chẵn/lẻ) dùng `i % 2 === 0`.
2. Khởi tạo `users: []` tạm thời để thấy dòng "Danh sách trống." xuất hiện khi list rỗng.
3. Thêm user mới vào mảng bằng nút bấm (`this.state.users.concat(...)`) và quan sát key mới sinh — nhấn mạnh không dùng index.
4. Render danh sách bằng `<ol>` và in `$index` từ 1 thay vì 0 (`i + 1`) — luyện biến đổi chỉ mục.
5. Dùng `users.slice(0, 2)` để chỉ render 2 phần tử đầu (↔ `limitTo:2`) và xác nhận `key` vẫn đúng.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
- https://legacy.reactjs.org/docs/lists-and-keys.html
- https://docs.angularjs.org/api/ng/directive/ngRepeat (đối chiếu $index/$first/$last)