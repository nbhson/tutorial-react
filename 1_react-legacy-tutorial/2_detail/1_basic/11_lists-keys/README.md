# 11. Lists & Keys

> ⚠️ LEGACY class nhưng `map` + `key` vẫn đúng đến nay.
> Đối chiếu AngularJS `ng-repeat` (và `track by`).

## Mục tiêu bài học
- Render danh sách bằng `Array.prototype.map` thay cho vòng lặp/`ng-repeat`.
- Hiểu vì sao **key** là bắt buộc và cách React dùng key để diff Virtual DOM chính xác.
- Tránh dùng `index` làm key khi danh sách thêm/xóa/sắp xếp.

## Khái niệm cốt lõi (Core)
- AngularJS: `<li ng-repeat="x in items">` — Angular duyệt mảng và tự nhân bản template; `track by x.id` giúp Angular nhận diện phần tử khi sắp xếp/lọc.
- React: JSX không có vòng lặp "template" — bạn **map mảng bằng JS thuần**: `{items.map(x => <li key={x.id}>{x.name}</li>)}`. Kết quả là mảng JSX được React render.
- **key** là nhãn định danh mỗi phần tử trong danh sách. Khi React diff cây Virtual DOM cũ/mới (thêm, xóa, đổi thứ tự), nó so sánh theo key để biết "phần tử nào là phần tử nào". Không có key (hoặc key trùng) → React có thể giữ nhầm state, DOM nhầm chỗ.
- Quy tắc: dùng **id ổn định** (từ DB), **không dùng `index`** nếu danh sách có thể đổi thứ tự / thêm xóa ở đầu. Dùng index thì khi xóa phần tử đầu, mọi key sau "dịch chuyển" → React nhận diện sai → state lệch (điển hình: ô input trong từng dòng bị nhảy giá trị).

### Keyword chính
`map` · `key` · `track by` · `Virtual DOM diff` · `reconciliation` · `index (không nên dùng)`.

## Luồng hoạt động (Flow)
1. `ListsDemo` khởi tạo state `{ items: [...3 item có id], next: "" }`.
2. Render: `this.state.items.map(function(x){ return <li key={x.id}>...` → mảng 3 `<li key=1,2,3>`.
3. Gõ thêm tên → `handleInput` set `next`; bấm "Thêm" → `add()` tính `id` mới = max id + 1 → `items.concat({id, name})` → re-render → `<li key=4>` thêm vào.
4. React diff: các key 1-3 không đổi → giữ nguyên DOM cũ; key mới → tạo node mới. Không render lại toàn bộ.
5. Bấm "Xóa" ở dòng nào → `remove(x.id)` → `filter` bỏ phần tử → re-render → React xóa đúng `<li>` có key đó.

**Chạy:** mở `index.html`, thử thêm/xóa để thấy key phát huy tác dụng.

## Ví dụ chi tiết
```jsx
// LEGACY class — đối chiếu ng-repeat + track by.
class ListsDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [
        { id: 1, name: "quick sort" },
        { id: 2, name: "merge sort" },
        { id: 3, name: "bubble sort" }
      ],
      next: "" // giá trị ô nhập để thêm item mới
    };
    this.handleInput = this.handleInput.bind(this);
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
  }
  handleInput(e) { this.setState({ next: e.target.value }); }
  add() {
    if (!this.state.next.trim()) return; // không cho thêm chuỗi rỗng
    this.setState(function (prev) {
      // Tạo id mới = max(id hiện có) + 1 — giữ id ổn định cho key
      const id = prev.items.length
        ? Math.max.apply(null, prev.items.map(function (x) { return x.id; })) + 1
        : 1;
      // concat (không mutate mảng cũ) — đúng tinh thần immutable
      return { items: prev.items.concat({ id: id, name: prev.next }), next: "" };
    });
  }
  remove(id) {
    this.setState(function (prev) {
      // filter tạo mảng mới, bỏ item có id tương ứng
      return { items: prev.items.filter(function (x) { return x.id !== id; }) };
    });
  }
  render() {
    const self = this;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Lists &amp; Keys (≈ ng-repeat)</h2>
        <p>
          <input value={this.state.next} onChange={this.handleInput} placeholder="Thuật toán mới" />
          <button onClick={this.add}>Thêm</button>
        </p>
        {/* key={x.id} ↔ track by x.id — giúp diff đúng từng <li> */}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {this.state.items.map(function (x) {
            return (
              <li key={x.id}>
                {x.name} <button onClick={function () { self.remove(x.id); }}>Xóa</button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`items.map(function(x){ return <li key={x.id}>...`)** : map trả về mảng JSX; để trong `{}` vì là expression. Không có template directive nào — chỉ JS.
- **`key={x.id}`**: React dùng để "truy vết" từng `<li>` qua các render. Khi xóa item id=2, React biết chính xác node mang key=2 cần gỡ.
- **`prev.items.concat(...)` / `filter(...)`**: không bao giờ đổi mảng state tại chỗ (`push`/`splice` trên `this.state.items` đều là mutate → diff sai). Luôn tạo mảng **mới** — pattern bất biến (immutable) đúng chuẩn React.
- **`onClick={function(){ self.remove(x.id); }}`**: closure lấy `x` của vòng map (tương đương `$index`/biến của ng-repeat). `self` là alias của `this` vì bên trong `function(){}` `this` không còn là instance.
- **Math.max.apply(null, ids) + 1**: sinh id tăng dần ổn định, tránh dùng index (vốn thay đổi khi xóa).

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-repeat="x in items"` | `items.map(x => <li key={x.id}>)` | Cùng duyệt mảng render nhiều node |
| `track by x.id` | `key={x.id}` | Cùng mục đích: định danh phần tử |
| `$index` / `$first` / `$last` | tham số thứ 2 của map: `map((x, i) => ...)` | Truyền rõ ràng qua tham số |
| `filter:q` trong repeat | `.filter()` trước `.map()` | Xử lý phía trước không phải directive |
| Angular quản DOM nhân bản | JSX array do map tạo | Không có "template vòng lặp" |

## Lỗi thường gặp (Common pitfalls)
- **Thiếu `key`** → React log cảnh báo + diff sai khi danh sách đổi. → Luôn đặt key trên phần tử ngoài cùng của mỗi item trong map.
- **Dùng `key={index}` cho danh sách thêm/xóa/đổi thứ tự** → xóa phần tử đầu làm state/DOM nhầm chỗ (vd ô input nhảy giá trị). → Dùng id ổn định. Chỉ dùng index cho danh sách tĩnh.
- **Key trùng lặp** (vd cả danh sách key=0) → React cảnh báo và không phân biệt được node. → Bảo đảm key unique trong cùng danh sách.
- **Mutate mảng state: `this.state.items.push(x)`** → React không phát hiện được (tham chiếu không đổi) hoặc diff sai. → Luôn tạo mảng mới (`concat`, `filter`, `slice`, spread).
- **`key` đặt trên thẻ lồng bên trong item** → React vẫn cảnh báo, cần key ở node gốc của item do map trả về.

## Best practices / Mẹo
- Key là "identity": lấy id ổn định từ dữ liệu, không phụ thuộc vị trí.
- Kết hợp `filter` + `map` (xem bài filter-search): lọc trước, map sau — đúng thứ tự như `ng-repeat | filter`.
- Muốn index (`$index`) thì nhận tham số 2: `map((x, i) => ...)` — không phụ thuộc magic variable.

## Bài tập nhỏ
1. Thêm nút "Đảo thứ tự" dùng `items.slice().reverse()` — quan sát React chỉ di chuyển node (nhờ key) thay vì render lại.
2. Đổi `key={x.id}` thành `key={i}` (index) rồi xóa phần tử đầu — nhập giá trị vào một item bất kỳ, xem state/DOM có bị lệch không, giải thích vì sao.

## Reference
- https://legacy.reactjs.org/docs/lists-and-keys.html
- https://legacy.reactjs.org/docs/reconciliation.html (thuật toán diff + key)
- https://legacy.reactjs.org/docs/thinking-in-react.html