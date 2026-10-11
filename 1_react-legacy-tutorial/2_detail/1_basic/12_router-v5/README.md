# 12. Router v5 (react-router-dom)

> ⚠️ LEGACY: react-router-dom **v5** (class + `withRouter`). Hiện nay nên dùng router v6+ (`useNavigate`, `useParams`).
> Đối chiếu AngularJS `12_routing` (`ngRoute`: `$routeProvider.when(...)` + `<div ng-view>`).

## Mục tiêu bài học
- Hiểu bản đồ mapping giữa `ngRoute` (AngularJS) và `react-router-dom v5`: Route, Link, Switch, params.
- Viết được bộ route cơ bản: `BrowserRouter`/`HashRouter` + `Switch` + `Route` + `Link`.
- Đọc param từ URL bằng `this.props.match.params` và xử lý trường hợp component không render trực tiếp bởi Route (`withRouter`).

## Khái niệm cốt lõi (Core)
- AngularJS ngRoute: khai báo `$routeProvider.when("/path", { templateUrl, controller })`, render kết quả vào `<div ng-view>`, điều hướng bằng `<a href="#!/about">`, đọc param qua `$routeParams`.
- react-router-dom v5: mọi thứ là **component**:
  - `<HashRouter>`/`<BrowserRouter>`: bọc cây, cung cấp bối cảnh định tuyến (HashRouter dùng `/#!/path` — chạy được khi mở file/CDN, đúng như ví dụ).
  - `<Switch>` + `<Route path="..." component={...}>`: ngôi nhà `ng-view` — render component khớp path đầu tiên; `exact` để khớp chính xác `/`.
  - `<Link to="/about">`: thẻ `a` do React quản lý, không reload trang (↔ `<a href="#!/about">`).
  - Param: `<Route path="/user/:id">` → component nhận `this.props.match.params.id` (↔ `$routeParams.id`).
- **`withRouter`**: component được render trực tiếp bởi Route thì có sẵn `match/location/history` trong props. Component render ở chỗ khác thì phải bọc `withRouter(Comp)` để được bơm các props này.

### Keyword chính
`BrowserRouter` · `HashRouter` · `Switch` · `Route` · `Link` · `match.params` · `withRouter` · `exact`.

## Luồng hoạt động (Flow)
1. `index.html` nạp CDN `react-router-dom@5` (UMD) → biến toàn cục `ReactRouterDOM`; `example.jsx` lấy `Route, Switch, Link, withRouter` từ đó.
2. `ReactDOM.render(<ReactRouterDOM.HashRouter><RouterDemo /></ReactRouterDOM.HashRouter>, ...)` — HashRouter cung cấp ngữ cảnh định tuyến.
3. `RouterDemo` render `<nav>` với 3 `<Link>` (Home, About, User 42) + `<Switch>` chứa 3 `<Route>`.
4. URL `/` → `Route exact path="/"` khớp → render `<Home>`. URL `/about` → `<About>`. URL `/user/42` → `Route path="/user/:id"` → render `UserWithRouter` với `match.params.id = "42"`.
5. Bấm `<Link>` → react-router cập nhật URL (không reload) → `Switch` tìm lại Route khớp → render component mới.

**Chạy:** bài này có README + `example.jsx` minh họa; bản CDN chạy được khi mở `index.html` (cần internet). Để chạy đầy đủ nên tạo app npm riêng:
```bash
npm install react@16 react-dom@16 react-router-dom@5
```

## Ví dụ chi tiết
```jsx
// LEGACY react-router-dom v5 (class + withRouter) — đối chiếu ngRoute.
// Chạy với npm: react@16 + react-router-dom@5. Bản CDN xem index.html.
var Router = window.ReactRouterDOM || {};
var Route = Router.Route, Switch = Router.Switch, Link = Router.Link, withRouter = Router.withRouter;

// Mỗi "trang" là một component — ↔ templateUrl + controller của ngRoute
class Home extends React.Component {
  render() { return <div><h3>Trang chủ (≈ template home.html)</h3></div>; }
}

class About extends React.Component {
  render() { return <div><h3>Giới thiệu</h3><p>Đối chiếu route "/about" của ngRoute.</p></div>; }
}

class User extends React.Component {
  render() {
    // ↔ $routeParams.id — params nằm trong this.props.match.params
    const id = this.props.match ? this.props.match.params.id : "?";
    return <div><h3>User #{id}</h3><p>Đọc param qua this.props.match.params.</p></div>;
  }
}
// User render bởi Route nên có match sẵn; vẫn bọc withRouter cho chắc
var UserWithRouter = withRouter ? withRouter(User) : User;

class RouterDemo extends React.Component {
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Router v5 (≈ ngRoute)</h2>
        <nav>
          {/* Link ↔ <a href="#!/"> — không reload trang */}
          <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/user/42">User 42</Link>
        </nav>
        {/* Switch + Route ↔ <div ng-view></div> — render component khớp path */}
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/user/:id" component={UserWithRouter} />
        </Switch>
      </div>
    );
  }
}
```

## Giải thích từng phần
- **`HashRouter`**: dùng URL dạng `#/about` — không cần cấu hình server (hợp với CDN/file). `BrowserRouter` dùng history API, path thật — cần server trỏ về index.html.
- **`<Switch>`**: chỉ render **Route khớp đầu tiên**; nếu không có Switch, nhiều Route khớp sẽ render cạnh nhau (khác `ng-view`).
- **`exact path="/"`**: bắt buộc với `/`, nếu không thì `/` khớp cả mọi path khác (vì ai cũng bắt đầu bằng `/`) → Home luôn hiện.
- **`path="/user/:id"`**: `:id` là dynamic segment — khớp `/user/42`, `/user/abc`; giá trị nằm ở `this.props.match.params.id`.
- **`withRouter(User)`**: nếu User được render tại nơi không phải trực tiếp bởi Route, React Router không tự bơm `match`/`history` vào props → bọc `withRouter` để nhận. Trong ví dụ này Route render trực tiếp nên có sẵn `match` (đoạn code vẫn xử lý `<Route component={UserWithRouter}>`).
- **History**: react-router dùng `history` để đổi URL mà không reload. `withRouter` bơm `history` (`.push`, `.replace`, `.goBack`) vào props; ở component con trực tiếp nó có sẵn, ở nơi khác phải bọc — tương đương `$location.path()` của AngularJS.

## So sánh AngularJS ↔ React (bảng markdown)
| ngRoute (AngularJS) | react-router-dom v5 | Ghi chú |
|---|---|---|
| `when("/", {templateUrl, controller})` | `<Route exact path="/" component={Home} />` | Cùng "path → view" |
| `<div ng-view></div>` | `<Switch>` + `<Route>` | Render view được chọn |
| `<a href="#!/about">` | `<Link to="/about">` | Link không reload |
| `$routeParams.id` | `this.props.match.params.id` | Param từ URL segment |
| `otherwise({redirectTo})` | `<Redirect>`/Route cuối không path | Fallback cho path lạ |
| `$locationProvider.html5Mode` | `BrowserRouter` vs `HashRouter` | Cấu hình dạng URL |

## Lỗi thường gặp (Common pitfalls)
- **Quên `exact` ở `path="/"`** → đường dẫn khác luôn khớp `/` trước → chỉ hiện Home. → Dùng `exact` cho path gốc (hoặc đổi cách khai báo).
- **Quên bọc `HashRouter`/`BrowserRouter`** → `Link`/`Route` báo lỗi "useHref() may be used only in the context of a Router". → Bọc component gốc trong Router.
- **Dùng `component={User}` ở nơi không phải Route-con trực tiếp** → `this.props.match` undefined → đọc `.params` lỗi. → Bọc `withRouter(User)` hoặc render qua `<Route>`.
- **Dùng `a href` thay vì `Link`** → trang reload, mất state (khác SPA). → Luôn dùng `<Link to>`.
- **Nhầm cú pháp v6 với v5** (`useNavigate` vs `useHistory`, `Routes` vs `Switch`) → code v5 không chạy v6. → Ở bài này giữ nguyên API v5 đã học.
- **Route lồng/không khớp**: `<Route path="/about">` không có `exact` vẫn khớp `/about/xyz`; ngược lại `/` không `exact` nuốt mọi path. → Cân nhắc `exact` cho path cụ thể, đặt route cụ thể trước route tham số.
- **Dùng CDN nhưng quên thẻ `react-router-dom`** → `window.ReactRouterDOM` undefined → `Route` là undefined. → Kiểm tra `index.html` đã nạp script UMD v5 trước `example.jsx`.

## Best practices / Mẹo
- Giữ URL "single source of truth" cho trạng thái có thể chia sẻ: đọc từ `match.params`/`location`, không nhân bản vào state.
- Tách từng "trang" thành component riêng (Layout + view) như tách template/controller của ngRoute.
- Đặt `Switch` + các Route có thứ tự cụ thể → cụ thể trước, mờ (like `:id`) sau.

## Bài tập nhỏ
1. Thêm route `/user/:id` thứ hai hiển thị tên user khác nhau theo id (vd array mock tên) — minh họa đọc `match.params.id` nhiều lần.
2. Thêm nút trong `Home` dùng `this.props.history.push("/about")` để điều hướng bằng code (cần `withRouter` nếu Home không phải Route-con trực tiếp).

## Reference
- https://v5.reactrouter.com/ (tài liệu v5)
- https://legacy.reactjs.org/docs/thinking-in-react.html
- https://docs.angularjs.org/api/ngRoute (đối chiếu ngRoute)