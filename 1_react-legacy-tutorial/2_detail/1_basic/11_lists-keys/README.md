# 11. Lists & Keys

> ⚠️ LEGACY class nhưng `map` + `key` vẫn đúng đến nay.
> Đối chiếu AngularJS `ng-repeat` (và `track by`).

## Mục tiêu bài học
- Render danh sách bằng `Array.prototype.map` thay cho vòng lặp/`ng-repeat`.
- Hiểu vì sao **key** là bắt buộc và cách React dùng key để diff Virtual DOM chính xác.
- Tránh dùng `index` làm key khi danh sách thêm/xóa/sắp xếp.

## Khái niệm cốt lõi (Core)

Mục này nói về bộ đôi `map` + `key` — cách React thay thế `ng-repeat`. Đọc để hiểu key không phải "thuộc tính trang trí" mà là chìa khóa để React diff chính xác.

- AngularJS: `<li ng-repeat="x in items">` — Angular duyệt mảng và tự nhân bản template; `track by x.id` giúp Angular nhận diện phần tử khi sắp xếp/lọc.
- React: JSX không có vòng lặp "template" — bạn **map mảng bằng JS thuần**: `{items.map(x => <li key={x.id}>{x.name}</li>)}`. Kết quả là mảng JSX được React render.
- **key** là nhãn định danh mỗi phần tử trong danh sách. Khi React diff cây Virtual DOM cũ/mới (thêm, xóa, đổi thứ tự), nó so sánh theo key để biết "phần tử nào là phần tử nào". Không có key (hoặc key trùng) → React có thể giữ nhầm state, DOM nhầm chỗ. Ví von: key giống số thẻ học sinh — đổi chỗ ngồi cả lớp thì giáo viên vẫn nhận đúng từng em qua số thẻ, chứ không phải đếm "em thứ 3 từ trái sang".
- Quy tắc: dùng **id ổn định** (từ DB), **không dùng `index`** nếu danh sách có thể đổi thứ tự / thêm xóa ở đầu. Dùng index thì khi xóa phần tử đầu, mọi key sau "dịch chuyển" → React nhận diện sai → state lệch (điển hình: ô input trong từng dòng bị nhảy giá trị).

> **Tóm gọn 1 câu:** `map` sinh ra danh sách JSX, `key` giúp React nhớ "ai là ai" qua các lần render — id ổn định là key tốt, index là key dối lòng.

### Keyword chính
`map` · `key` · `track by` · `Virtual DOM diff` · `reconciliation` · `index (không nên dùng)`.

## Luồng hoạt động (Flow)

Mục này diễn lại một vòng: thêm item mới → React diff theo key → chỉ DOM node mới được tạo, các node cũ giữ nguyên.

1. `ListsDemo` khởi tạo state `{ items: [...3 item có id], next: "" }`.
2. Render: `this.state.items.map(function(x){ return <li key={x.id}>...` → mảng 3 `<li key=1,2,3>`.
3. Gõ thêm tên → `handleInput` set `next`; bấm "Thêm" → `add()` tính `id` mới = max id + 1 → `items.concat({id, name})` → re-render → `<li key=4>` thêm vào.
4. React diff: các key 1-3 không đổi → giữ nguyên DOM cũ; key mới → tạo node mới. Không render lại toàn bộ.
5. Bấm "Xóa" ở dòng nào → `remove(x.id)` → `filter` bỏ phần tử → re-render → React xóa đúng `<li>` có key đó.

**Chạy:** mở `index.html`, thử thêm/xóa để thấy key phát huy tác dụng.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`items.map(function(x){ return <li key={x.id}>...`)** : map trả về mảng JSX; để trong `{}` vì là expression. Không có template directive nào — chỉ JS.
- **`key={x.id}`**: React dùng để "truy vết" từng `<li>` qua các render. Khi xóa item id=2, React biết chính xác node mang key=2 cần gỡ.
- **`prev.items.concat(...)` / `filter(...)`**: không bao giờ đổi mảng state tại chỗ (`push`/`splice` trên `this.state.items` đều là mutate → diff sai). Luôn tạo mảng **mới** — pattern bất biến (immutable) đúng chuẩn React.
- **`onClick={function(){ self.remove(x.id); }}`**: closure lấy `x` của vòng map (tương đương `$index`/biến của ng-repeat). `self` là alias của `this` vì bên trong `function(){}` `this` không còn là instance.
- **Math.max.apply(null, ids) + 1**: sinh id tăng dần ổn định, tránh dùng index (vốn thay đổi khi xóa).

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này dịch từng "tính năng" của `ng-repeat` sang bản tương đương bằng JS thuần — đọc ngang để có công thức chuyển đổi nhanh.

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-repeat="x in items"` | `items.map(x => <li key={x.id}>)` | Cùng duyệt mảng render nhiều node |
| `track by x.id` | `key={x.id}` | Cùng mục đích: định danh phần tử |
| `$index` / `$first` / `$last` | tham số thứ 2 của map: `map((x, i) => ...)` | Truyền rõ ràng qua tham số |
| `filter:q` trong repeat | `.filter()` trước `.map()` | Xử lý phía trước không phải directive |
| Angular quản DOM nhân bản | JSX array do map tạo | Không có "template vòng lặp" |

> **Cách đọc bảng này:** mỗi dòng là một "magic" của `ng-repeat` và bản dịch JS của nó; cột *Ghi chú* nhắc rằng React bỏ hết magic — mọi thứ trở thành hàm JS bạn tự viết.

> **Tóm gọn 1 câu:** `ng-repeat` là "máy làm danh sách tự động", còn `map` + `key` là bạn tự làm — máy móc ít hơn nhưng quyền kiểm soát nhiều hơn.

## Lỗi thường gặp (Common pitfalls)

Key là nơi sinh ra nhiều lỗi âm thầm nhất (không crash nhưng UI sai) — mục này liệt kê các kiểu lỗi đó.

- **Thiếu `key`** → React log cảnh báo + diff sai khi danh sách đổi. → Luôn đặt key trên phần tử ngoài cùng của mỗi item trong map.
- **Dùng `key={index}` cho danh sách thêm/xóa/đổi thứ tự** → xóa phần tử đầu làm state/DOM nhầm chỗ (vd ô input nhảy giá trị). → Dùng id ổn định. Chỉ dùng index cho danh sách tĩnh.
- **Key trùng lặp** (vd cả danh sách key=0) → React cảnh báo và không phân biệt được node. → Bảo đảm key unique trong cùng danh sách.
- **Mutate mảng state: `this.state.items.push(x)`** → React không phát hiện được (tham chiếu không đổi) hoặc diff sai. → Luôn tạo mảng mới (`concat`, `filter`, `slice`, spread).
- **`key` đặt trên thẻ lồng bên trong item** → React vẫn cảnh báo, cần key ở node gốc của item do map trả về.

> **Tóm gọn 1 câu:** Lỗi về key thường "im lặng" — app vẫn chạy nhưng state lệch chỗ — nên hãy tập thói quen đặt id ổn định làm key ngay từ đầu.

## Best practices / Mẹo
- Key là "identity": lấy id ổn định từ dữ liệu, không phụ thuộc vị trí.
- Kết hợp `filter` + `map` (xem bài filter-search): lọc trước, map sau — đúng thứ tự như `ng-repeat | filter`.
- Muốn index (`$index`) thì nhận tham số 2: `map((x, i) => ...)` — không phụ thuộc magic variable.

## Bài tập nhỏ

Bài tập số 2 ở đây rất đáng làm: tự tay phá key để thấy hậu quả — hiểu bằng xương thịt hơn là đọc lý thuyết.

1. Thêm nút "Đảo thứ tự" dùng `items.slice().reverse()` — quan sát React chỉ di chuyển node (nhờ key) thay vì render lại.
2. Đổi `key={x.id}` thành `key={i}` (index) rồi xóa phần tử đầu — nhập giá trị vào một item bất kỳ, xem state/DOM có bị lệch không, giải thích vì sao.

## Reference
- https://legacy.reactjs.org/docs/lists-and-keys.html
- https://legacy.reactjs.org/docs/reconciliation.html (thuật toán diff + key)
- https://legacy.reactjs.org/docs/thinking-in-react.html