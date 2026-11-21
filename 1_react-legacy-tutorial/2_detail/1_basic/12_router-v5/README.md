# 12. Router v5 (react-router-dom)

> ⚠️ LEGACY: react-router-dom **v5** (class + `withRouter`). Hiện nay nên dùng router v6+ (`useNavigate`, `useParams`).
> Đối chiếu AngularJS `12_routing` (`ngRoute`: `$routeProvider.when(...)` + `<div ng-view>`).

## Mục tiêu bài học
- Hiểu bản đồ mapping giữa `ngRoute` (AngularJS) và `react-router-dom v5`: Route, Link, Switch, params.
- Viết được bộ route cơ bản: `BrowserRouter`/`HashRouter` + `Switch` + `Route` + `Link`.
- Đọc param từ URL bằng `this.props.match.params` và xử lý trường hợp component không render trực tiếp bởi Route (`withRouter`).

## Khái niệm cốt lõi (Core)

Mục này nói về cách "dịch" ngRoute sang react-router v5: mọi khái niệm bạn biết đều có component tương ứng. Đọc để có bản đồ khái niệm trước khi viết code.

- AngularJS ngRoute: khai báo `$routeProvider.when("/path", { templateUrl, controller })`, render kết quả vào `<div ng-view>`, điều hướng bằng `<a href="#!/about">`, đọc param qua `$routeParams`.
- react-router-dom v5: mọi thứ là **component**:
  - `<HashRouter>`/`<BrowserRouter>`: bọc cây, cung cấp bối cảnh định tuyến (HashRouter dùng `/#!/path` — chạy được khi mở file/CDN, đúng như ví dụ).
  - `<Switch>` + `<Route path="..." component={...}>`: ngôi nhà `ng-view` — render component khớp path đầu tiên; `exact` để khớp chính xác `/`.
  - `<Link to="/about">`: thẻ `a` do React quản lý, không reload trang (↔ `<a href="#!/about">`).
  - Param: `<Route path="/user/:id">` → component nhận `this.props.match.params.id` (↔ `$routeParams.id`).
- **`withRouter`**: component được render trực tiếp bởi Route thì có sẵn `match/location/history` trong props. Component render ở chỗ khác thì phải bọc `withRouter(Comp)` để được bơm các props này. Ví von: `withRouter` giống thẻ ưu tiên ở sân bay — ai check-in trực tiếp ở quầy Route thì được tặng sẵn; ai đến từ "cửa khác" phải xin cấp lại thẻ.

> **Tóm gọn 1 câu:** React Router v5 là "ngRoute viết bằng component": Router bọc tất cả, Switch chọn, Route khớp, Link điều hướng, `match.params` đọc tham số.

### Keyword chính
`BrowserRouter` · `HashRouter` · `Switch` · `Route` · `Link` · `match.params` · `withRouter` · `exact`.

## Luồng hoạt động (Flow)

Mục này lần theo một cú click Link: URL đổi (không reload) → Switch tìm Route khớp → component mới được render.

1. `index.html` nạp CDN `react-router-dom@5` (UMD) → biến toàn cục `ReactRouterDOM`; `example.jsx` lấy `Route, Switch, Link, withRouter` từ đó.
2. `ReactDOM.render(<ReactRouterDOM.HashRouter><RouterDemo /></ReactRouterDOM.HashRouter>, ...)` — HashRouter cung cấp ngữ cảnh định tuyến.
3. `RouterDemo` render `<nav>` với 3 `<Link>` (Home, About, User 42) + `<Switch>` chứa 3 `<Route>`.
4. URL `/` → `Route exact path="/"` khớp → render `<Home>`. URL `/about` → `<About>`. URL `/user/42` → `Route path="/user/:id"` → render `UserWithRouter` với `match.params.id = "42"`.
5. Bấm `<Link>` → react-router cập nhật URL (không reload) → `Switch` tìm lại Route khớp → render component mới.

**Chạy:** bài này có README + `example.jsx` minh họa; bản CDN chạy được khi mở `index.html` (cần internet). Để chạy đầy đủ nên tạo app npm riêng:
> 📄 **Code ví dụ:** [`examples/01-luong-hoat-ong-flow.sh`](examples/01-luong-hoat-ong-flow.sh)

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.jsx`](examples/02-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`HashRouter`**: dùng URL dạng `#/about` — không cần cấu hình server (hợp với CDN/file). `BrowserRouter` dùng history API, path thật — cần server trỏ về index.html.
- **`<Switch>`**: chỉ render **Route khớp đầu tiên**; nếu không có Switch, nhiều Route khớp sẽ render cạnh nhau (khác `ng-view`).
- **`exact path="/"`**: bắt buộc với `/`, nếu không thì `/` khớp cả mọi path khác (vì ai cũng bắt đầu bằng `/`) → Home luôn hiện.
- **`path="/user/:id"`**: `:id` là dynamic segment — khớp `/user/42`, `/user/abc`; giá trị nằm ở `this.props.match.params.id`.
- **`withRouter(User)`**: nếu User được render tại nơi không phải trực tiếp bởi Route, React Router không tự bơm `match`/`history` vào props → bọc `withRouter` để nhận. Trong ví dụ này Route render trực tiếp nên có sẵn `match` (đoạn code vẫn xử lý `<Route component={UserWithRouter}>`).
- **History**: react-router dùng `history` để đổi URL mà không reload. `withRouter` bơm `history` (`.push`, `.replace`, `.goBack`) vào props; ở component con trực tiếp nó có sẵn, ở nơi khác phải bọc — tương đương `$location.path()` của AngularJS.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này là bản đồ dịch ngRoute → react-router v5, từng API một — đọc ngang để có công thức chuyển đổi khi bảo trì code cũ.

| ngRoute (AngularJS) | react-router-dom v5 | Ghi chú |
|---|---|---|
| `when("/", {templateUrl, controller})` | `<Route exact path="/" component={Home} />` | Cùng "path → view" |
| `<div ng-view></div>` | `<Switch>` + `<Route>` | Render view được chọn |
| `<a href="#!/about">` | `<Link to="/about">` | Link không reload |
| `$routeParams.id` | `this.props.match.params.id` | Param từ URL segment |
| `otherwise({redirectTo})` | `<Redirect>`/Route cuối không path | Fallback cho path lạ |
| `$locationProvider.html5Mode` | `BrowserRouter` vs `HashRouter` | Cấu hình dạng URL |

> **Cách đọc bảng này:** mỗi dòng là một tính năng routing (khai báo route, hiển thị view, điều hướng, param...); đọc cột *Ghi chú* để thấy hai bên "cùng mục đích, khác cơ chế" ở đâu.

> **Tóm gọn 1 câu:** Mỗi API của ngRoute đều có một component tương ứng trong react-router v5 — cấu hình text trở thành cây JSX.

## Lỗi thường gặp (Common pitfalls)

Routing nhiều bẫy "chạy được mà sai hành vi" (đặc biệt là quên `exact`) — mục này liệt kê để bạn nhận ra triệu chứng ngay.
- **Quên `exact` ở `path="/"`** → đường dẫn khác luôn khớp `/` trước → chỉ hiện Home. → Dùng `exact` cho path gốc (hoặc đổi cách khai báo).
- **Quên bọc `HashRouter`/`BrowserRouter`** → `Link`/`Route` báo lỗi "useHref() may be used only in the context of a Router". → Bọc component gốc trong Router.
- **Dùng `component={User}` ở nơi không phải Route-con trực tiếp** → `this.props.match` undefined → đọc `.params` lỗi. → Bọc `withRouter(User)` hoặc render qua `<Route>`.
- **Dùng `a href` thay vì `Link`** → trang reload, mất state (khác SPA). → Luôn dùng `<Link to>`.
- **Nhầm cú pháp v6 với v5** (`useNavigate` vs `useHistory`, `Routes` vs `Switch`) → code v5 không chạy v6. → Ở bài này giữ nguyên API v5 đã học.
- **Route lồng/không khớp**: `<Route path="/about">` không có `exact` vẫn khớp `/about/xyz`; ngược lại `/` không `exact` nuốt mọi path. → Cân nhắc `exact` cho path cụ thể, đặt route cụ thể trước route tham số.
- **Dùng CDN nhưng quên thẻ `react-router-dom`** → `window.ReactRouterDOM` undefined → `Route` là undefined. → Kiểm tra `index.html` đã nạp script UMD v5 trước `example.jsx`.

> **Tóm gọn 1 câu:** Lỗi router thường hiện thành "trang trắng hoặc sai view" — nhớ 2 điều: quên `exact` ở `/` và quên bọc Router là hai nguyên nhân hàng đầu.

## Best practices / Mẹo
- Giữ URL "single source of truth" cho trạng thái có thể chia sẻ: đọc từ `match.params`/`location`, không nhân bản vào state.
- Tách từng "trang" thành component riêng (Layout + view) như tách template/controller của ngRoute.
- Đặt `Switch` + các Route có thứ tự cụ thể → cụ thể trước, mờ (like `:id`) sau.

## Bài tập nhỏ

Hai bài này luyện việc đọc param và điều hướng bằng code — hai kỹ năng dùng nhiều nhất khi làm router thật.

1. Thêm route `/user/:id` thứ hai hiển thị tên user khác nhau theo id (vd array mock tên) — minh họa đọc `match.params.id` nhiều lần.
2. Thêm nút trong `Home` dùng `this.props.history.push("/about")` để điều hướng bằng code (cần `withRouter` nếu Home không phải Route-con trực tiếp).

## Reference
- https://v5.reactrouter.com/ (tài liệu v5)
- https://legacy.reactjs.org/docs/thinking-in-react.html
- https://docs.angularjs.org/api/ngRoute (đối chiếu ngRoute)