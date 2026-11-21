# 8. HTTP với fetch

> ⚠️ LEGACY: class + `fetch` trong `componentDidMount`. Hiện nay: `useEffect` + `fetch`/thư viện.
> Đối chiếu AngularJS `8_http` (`$http.get("data.json")`).

## Mục tiêu bài học
- Gọi API từ class component bằng `fetch` tại đúng thời điểm: `componentDidMount` (hoặc sự kiện).
- Quản lý đủ 3 trạng thái của request: `loading / error / data`.
- Xử lý `this` đúng cách khi dùng callback `function(){}` (bind) trong class legacy.

## Khái niệm cốt lõi (Core)

Mục này nói về cách gọi API đúng chỗ trong React class: thời điểm nào (`componentDidMount`), quản lý 3 trạng thái nào, và những gì `fetch` không làm giúp bạn.

- AngularJS: `$http.get(url).then(...)` trong controller, kết quả gán vào `$scope` → digest cập nhật UI.
- React legacy: gọi `fetch()` (API của trình duyệt, trả về **Promise**) trong `componentDidMount`; khi có dữ liệu → `this.setState(...)` → React re-render. Không có "digest" tự động — bạn chủ động đưa kết quả vào state.
- Luôn quản lý 3 trạng thái để UI không "im lặng" khi lỗi hoặc đang chờ:
  - `loading: true` → hiện "Đang tải..."
  - `error` khác null → hiện thông báo lỗi
  - còn lại → render danh sách `users`
- `fetch` trả Promise; `.then(res => res.json())` đọc body JSON. Lưu ý `fetch` **chỉ reject khi mạng lỗi** (không reject với HTTP 404/500) — ví dụ giữ đơn giản theo bản gốc, chỉ bắt lỗi tổng bằng `.catch`.

Ví von: một request giống cuộc gọi giao hàng — bạn cần cả 3 trạng thái: đang trên đường (loading), giao hỏng (error), giao xong (data). Thiếu bất kỳ trạng thái nào, người dùng sẽ đứng chờ trước cửa mà không biết chuyện gì xảy ra.

> **Tóm gọn 1 câu:** Fetch trong `componentDidMount`, quản đủ bộ ba `loading/error/data` — UI không bao giờ được "im lặng" giữa chừng.

### Keyword chính
`fetch` · `Promise` · `res.json()` · `componentDidMount` · `loading/error/data` · `.bind(this)` · CORS.

## Luồng hoạt động (Flow)

Mục này lần theo một request từ lúc mount đến khi dữ liệu lên màn hình — cùng nhánh lỗi khi mạng/CORS có vấn đề.

1. `HttpDemo` mount → `componentDidMount()` tự động chạy → gọi `this.loadLocal()`.
2. `loadLocal()`: set `loading: true` → `fetch("data.json")` bắt đầu (async, không chặn UI).
3. Response tới → `.then(function(res){ return res.json(); })` → chuỗi JSON thành mảng object.
4. `.then(...)` thứ hai: `this.setState({ users: data, loading: false })` → re-render → render danh sách `<li>`.
5. Nếu lỗi (mạng/CORS...): `.catch(...)` → `setState({ error, loading: false })` → render dòng lỗi đỏ.
6. Bấm "Tải API remote" → `loadRemote()` lặp lại quy trình với `jsonplaceholder.typicode.com`.

**Chạy:** mở `index.html` bằng trình duyệt (mở qua `npx serve` để `fetch("data.json")` hoạt động; mở `file://` sẽ bị chặn CORS).

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`componentDidMount() { this.loadLocal(); }`**: thời điểm chuẩn để fetch lần đầu — sau mount, an toàn để setState. (↔ `$onInit`/gọi `$http` trong controller.)
- **`fetch("data.json")`**: tương đương `$http.get("data.json")` nhưng là API JS chuẩn, trả Promise. Dữ liệu local ở đây cần chạy qua HTTP server vì `file://` bị trình duyệt chặn (CORS).
- **`.then(function(res){ return res.json(); })`**: `res.json()` *cũng* trả Promise — phải `return` để chuỗi `.then` chờ parse xong.
- **`.bind(this)` trên callback**: bên trong `function(){}`, `this` không còn là instance class — không bind thì `this.setState` báo lỗi. (Cách hiện đại: arrow function không cần bind.)
- **`setState({users: data, loading: false})`**: vừa cập nhật dữ liệu vừa tắt cờ loading → một lần render; không như `$scope` cần `$apply`.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này đối chiếu `$http` với `fetch` từng khâu: gọi, nhận kết quả, cập nhật UI, xử lý lỗi.

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `$http.get(url).then(...)` | `fetch(url).then(...)` | Cùng Promise-based |
| Gán `$scope.items = data` → digest | `this.setState({items: data})` → re-render | React cần setState chủ động |
| Gọi trong controller (`$onInit`) | Gọi trong `componentDidMount` | Cùng thời điểm "đã sẵn sàng" |
| `$scope.loading` quản tay | state `loading/error/data` | Cùng mô hình 3 trạng thái |
| `$q` / callbacks | Promise + `.catch` | JS thuần, không cần service |

> **Cách đọc bảng này:** mỗi dòng là một khâu của chuỗi request; điểm cần đọc kỹ là cột *Ghi chú* — cả hai đều Promise-based nhưng React bắt bạn "tự tay" đưa kết quả vào state.

> **Tóm gọn 1 câu:** `$http` và `fetch` cùng làm một việc, khác ở chỗ React không có digest — kết quả về phải được đưa vào state bằng tay.

## Lỗi thường gặp (Common pitfalls)

Với fetch, lỗi phổ biến nhất không phải fetch sai mà là `this` sai bên trong callback — cùng vài bẫy khác dưới đây.

- **Không bind callback**: `.then(function(d){ this.setState(...) })` → `this is undefined`. → `.bind(this)` hoặc arrow function.
- **Quên `.bind` lỗi khi dùng `res.json()`** bên trong `.then` đầu — không liên quan; lỗi thật là `this` trong `.then` thứ 2.
- **`componentDidMount` gọi API dữ liệu phụ thuộc props/state đổi sau** → chỉ chạy 1 lần. → Đặt thêm hàm load và gọi từ `componentDidUpdate` có điều kiện (hoặc sự kiện).
- **Không xử lý lỗi (.catch)** → request fail UI treo "Đang tải..." mãi. → Luôn `.catch` và set state `error`.
- **Mở trực tiếp qua `file://` khi fetch file local** → bị chặn CORS, không có data.json. → Chạy qua `npx serve` hoặc http-server.
- **Nghĩ `fetch` reject khi HTTP 404/500** → không; `fetch` chỉ reject khi lỗi mạng. Cần kiểm tra `res.ok` nếu muốn bắt lỗi HTTP. → Thêm `if (!res.ok) throw new Error(res.status)`.

> **Tóm gọn 1 câu:** Hai lỗi "chân ái" với fetch: quên `.bind(this)` trong callback, và tin rằng 404/500 sẽ rơi vào `.catch` — đều không có đâu.

## Best practices / Mẹo
- Luôn khởi tạo state đủ 3 cờ `loading/error/data` — làm UI minh bạch.
- Khóa trạng thái: component bị unmount giữa chừng request thì `setState` sau đó vô nghĩa — trong legacy có thể dùng cờ `this._mounted` trong `componentWillUnmount`.
- Tách hàm load riêng (`loadLocal`, `loadRemote`) để gọi lại dễ dàng mà không duplicate code.

## Bài tập nhỏ

Bài số 2 đáng làm ngay: tự tạo lỗi để xem nhánh `error` hiện lên — test cả đường vui lẫn đường buồn.

1. Thêm nút "Tải lại" gọi `this.loadLocal()` — so sánh với việc `$http` được gọi lại bằng `$watch`.
2. Mô phỏng lỗi bằng cách đổi URL thành `https://jsonplaceholder.typicode.com/nonexistent` và quan sát nhánh `error`.

## Reference
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
- https://legacy.reactjs.org/docs/faq-ajax.html