# 8. HTTP với fetch

> ⚠️ LEGACY: class + `fetch` trong `componentDidMount`. Hiện nay: `useEffect` + `fetch`/thư viện.
> Đối chiếu AngularJS `8_http` (`$http.get("data.json")`).

## Mục tiêu bài học
- Gọi API từ class component bằng `fetch` tại đúng thời điểm: `componentDidMount` (hoặc sự kiện).
- Quản lý đủ 3 trạng thái của request: `loading / error / data`.
- Xử lý `this` đúng cách khi dùng callback `function(){}` (bind) trong class legacy.

## Khái niệm cốt lõi (Core)
- AngularJS: `$http.get(url).then(...)` trong controller, kết quả gán vào `$scope` → digest cập nhật UI.
- React legacy: gọi `fetch()` (API của trình duyệt, trả về **Promise**) trong `componentDidMount`; khi có dữ liệu → `this.setState(...)` → React re-render. Không có "digest" tự động — bạn chủ động đưa kết quả vào state.
- Luôn quản lý 3 trạng thái để UI không "im lặng" khi lỗi hoặc đang chờ:
  - `loading: true` → hiện "Đang tải..."
  - `error` khác null → hiện thông báo lỗi
  - còn lại → render danh sách `users`
- `fetch` trả Promise; `.then(res => res.json())` đọc body JSON. Lưu ý `fetch` **chỉ reject khi mạng lỗi** (không reject với HTTP 404/500) — ví dụ giữ đơn giản theo bản gốc, chỉ bắt lỗi tổng bằng `.catch`.

### Keyword chính
`fetch` · `Promise` · `res.json()` · `componentDidMount` · `loading/error/data` · `.bind(this)` · CORS.

## Luồng hoạt động (Flow)
1. `HttpDemo` mount → `componentDidMount()` tự động chạy → gọi `this.loadLocal()`.
2. `loadLocal()`: set `loading: true` → `fetch("data.json")` bắt đầu (async, không chặn UI).
3. Response tới → `.then(function(res){ return res.json(); })` → chuỗi JSON thành mảng object.
4. `.then(...)` thứ hai: `this.setState({ users: data, loading: false })` → re-render → render danh sách `<li>`.
5. Nếu lỗi (mạng/CORS...): `.catch(...)` → `setState({ error, loading: false })` → render dòng lỗi đỏ.
6. Bấm "Tải API remote" → `loadRemote()` lặp lại quy trình với `jsonplaceholder.typicode.com`.

**Chạy:** mở `index.html` bằng trình duyệt (mở qua `npx serve` để `fetch("data.json")` hoạt động; mở `file://` sẽ bị chặn CORS).

## Ví dụ chi tiết
```jsx
// LEGACY class + fetch — đối chiếu $http.get.
class HttpDemo extends React.Component {
  constructor(props) {
    super(props);
    // 3 trạng thái: loading / error / data — quản lý rõ ràng ngay từ đầu
    this.state = { loading: true, error: null, users: [] };
    this.loadLocal = this.loadLocal.bind(this);   // bind vì dùng function(){} bên trong
    this.loadRemote = this.loadRemote.bind(this);
  }
  componentDidMount() {
    this.loadLocal(); // ↔ $onInit: gọi dữ liệu lần đầu khi component xuất hiện
  }
  loadLocal() {
    this.setState({ loading: true, error: null }); // báo UI "đang tải"
    fetch("data.json")                              // trả về Promise
      .then(function (res) { return res.json(); })  // đọc body JSON
      .then(function (data) { this.setState({ users: data, loading: false }); }.bind(this))
      .catch(function (err) { this.setState({ error: String(err), loading: false }); }.bind(this));
  }
  loadRemote() {
    this.setState({ loading: true, error: null });
    fetch("https://jsonplaceholder.typicode.com/users?_limit=5")
      .then(function (res) { return res.json(); })
      .then(function (data) { this.setState({ users: data, loading: false }); }.bind(this))
      .catch(function (err) { this.setState({ error: String(err), loading: false }); }.bind(this));
  }
  render() {
    const s = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>HTTP fetch (≈ $http)</h2>
        <p>
          <button onClick={this.loadLocal}>Tải data.json (local)</button>{" "}
          <button onClick={this.loadRemote}>Tải API remote</button>
        </p>
        {s.loading && <p>Đang tải...</p>}                    {/* state 1: loading */}
        {s.error && <p style={{ color: "red" }}>Lỗi: {s.error}</p>} {/* state 2: error */}
        {!s.loading && !s.error && (                        {/* state 3: có data */}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {s.users.map(function (u) {
              return <li key={u.id}>{u.name} — {u.email}</li>;
            })}
          </ul>
        )}
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`componentDidMount() { this.loadLocal(); }`**: thời điểm chuẩn để fetch lần đầu — sau mount, an toàn để setState. (↔ `$onInit`/gọi `$http` trong controller.)
- **`fetch("data.json")`**: tương đương `$http.get("data.json")` nhưng là API JS chuẩn, trả Promise. Dữ liệu local ở đây cần chạy qua HTTP server vì `file://` bị trình duyệt chặn (CORS).
- **`.then(function(res){ return res.json(); })`**: `res.json()` *cũng* trả Promise — phải `return` để chuỗi `.then` chờ parse xong.
- **`.bind(this)` trên callback**: bên trong `function(){}`, `this` không còn là instance class — không bind thì `this.setState` báo lỗi. (Cách hiện đại: arrow function không cần bind.)
- **`setState({users: data, loading: false})`**: vừa cập nhật dữ liệu vừa tắt cờ loading → một lần render; không như `$scope` cần `$apply`.

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `$http.get(url).then(...)` | `fetch(url).then(...)` | Cùng Promise-based |
| Gán `$scope.items = data` → digest | `this.setState({items: data})` → re-render | React cần setState chủ động |
| Gọi trong controller (`$onInit`) | Gọi trong `componentDidMount` | Cùng thời điểm "đã sẵn sàng" |
| `$scope.loading` quản tay | state `loading/error/data` | Cùng mô hình 3 trạng thái |
| `$q` / callbacks | Promise + `.catch` | JS thuần, không cần service |

## Lỗi thường gặp (Common pitfalls)
- **Không bind callback**: `.then(function(d){ this.setState(...) })` → `this is undefined`. → `.bind(this)` hoặc arrow function.
- **Quên `.bind` lỗi khi dùng `res.json()`** bên trong `.then` đầu — không liên quan; lỗi thật là `this` trong `.then` thứ 2.
- **`componentDidMount` gọi API dữ liệu phụ thuộc props/state đổi sau** → chỉ chạy 1 lần. → Đặt thêm hàm load và gọi từ `componentDidUpdate` có điều kiện (hoặc sự kiện).
- **Không xử lý lỗi (.catch)** → request fail UI treo "Đang tải..." mãi. → Luôn `.catch` và set state `error`.
- **Mở trực tiếp qua `file://` khi fetch file local** → bị chặn CORS, không có data.json. → Chạy qua `npx serve` hoặc http-server.
- **Nghĩ `fetch` reject khi HTTP 404/500** → không; `fetch` chỉ reject khi lỗi mạng. Cần kiểm tra `res.ok` nếu muốn bắt lỗi HTTP. → Thêm `if (!res.ok) throw new Error(res.status)`.

## Best practices / Mẹo
- Luôn khởi tạo state đủ 3 cờ `loading/error/data` — làm UI minh bạch.
- Khóa trạng thái: component bị unmount giữa chừng request thì `setState` sau đó vô nghĩa — trong legacy có thể dùng cờ `this._mounted` trong `componentWillUnmount`.
- Tách hàm load riêng (`loadLocal`, `loadRemote`) để gọi lại dễ dàng mà không duplicate code.

## Bài tập nhỏ
1. Thêm nút "Tải lại" gọi `this.loadLocal()` — so sánh với việc `$http` được gọi lại bằng `$watch`.
2. Mô phỏng lỗi bằng cách đổi URL thành `https://jsonplaceholder.typicode.com/nonexistent` và quan sát nhánh `error`.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
- https://legacy.reactjs.org/docs/faq-ajax.html