# React Legacy Tutorial (Class Components — thời pre-Hooks)

> ⚠️ **LEGACY — Chỉ để học/đối chiếu với AngularJS.** Hiện nay nên dùng **function components + hooks** (xem [`3_react-tutorial`](../3_react-tutorial)).
> Mọi ví dụ dưới đây cố ý dùng **class components (React 15/16 era)** để người học AngularJS dễ ánh xạ:
> `controller/$scope` → `class + this.state`, `ng-repeat` → `array.map()`, `filter` → hàm JS + `Intl`.

## Mục tiêu
- Giúp người đến từ **AngularJS 1.x** ánh xạ 1-1 sang React cũ: directive ↔ JSX, two-way binding ↔ controlled component, `$http` ↔ `fetch`, service ↔ context.
- Hiểu **vì sao** React chuyển sang hooks: class khó tái sử dụng logic, `this` phức tạp, lifecycle dễ sinh bug.
- Thấy rõ khác biệt tư duy: AngularJS dùng **digest cycle + watchers**, React dùng **render lại cả cây rồi diff Virtual DOM**.

## Vì sao vẫn học phiên bản legacy?
- Nhiều codebase React cũ (2015–2018) vẫn còn class component; đọc hiểu được là kỹ năng cần thiết khi bảo trì.
- Đối chiếu trực tiếp với AngularJS giúp **nhận ra pattern tương đương** thay vì học lại từ đầu.
- Tuy nhiên, **đừng viết code mới bằng class**. Sau khi học xong phần này, chuyển ngay sang `3_react-tutorial`.

## Cấu trúc (đối chiếu `1_angularjs-tutorial`)

```
1_react-legacy-tutorial/
├── 1_overview/                        # app mẫu nhỏ: JSX, Virtual DOM, React 15/16
├── 2_detail/
│   ├── 1_basic/                       # 11 bài ~ AngularJS 1_basic
│   │   ├── 1_expressions/             # ↔ ng-init/{{ }}
│   │   ├── 2_components/              # ↔ module/controller/directive
│   │   ├── 3_props-state/             # ↔ $scope / ng-model
│   │   ├── 5_class-lifecycle/         # ↔ $onInit/$onDestroy
│   │   ├── 6_context-legacy/          # ↔ service/inject (contextTypes cũ)
│   │   ├── 7_refs/                    # ↔ thao tác DOM
│   │   ├── 8_http-fetch/              # ↔ $http
│   │   ├── 9_events/                  # ↔ ng-click/ng-change
│   │   ├── 10_forms-controlled/       # ↔ ng-model two-way binding
│   │   ├── 11_lists-keys/             # ↔ ng-repeat
│   │   └── 12_router-v5/              # ↔ ngRoute (react-router-dom v5)
│   ├── 2_directives-equivalent/        # ↔ ng-if / ng-repeat / ng-class
│   │   ├── conditional-rendering/
│   │   ├── lists-map/
│   │   └── styling/
│   └── 3_helpers/                     # ↔ AngularJS filter
│       ├── format/                    # date/number/currency bằng Intl
│       ├── filter-search/
│       └── sort/
└── 3_unit-test/                       # Vitest + React Testing Library (npm, không bower)
```

## Thứ tự đọc gợi ý
1. `1_overview/` — nắm JSX, Virtual DOM, và cách React 16 render vào DOM.
2. `2_detail/1_basic/` theo số thứ tự: biểu thức → component → props/state → lifecycle → context/refs → http → event → form → list → router.
3. `2_detail/2_directives-equivalent/` — đối chiếu trực tiếp với directive AngularJS quen thuộc.
4. `2_detail/3_helpers/` — thay filter AngularJS bằng `Intl` + hàm thuần.
5. `3_unit-test/` — viết test với Vitest + Testing Library (thay Jasmine/Karma cũ).

## Cách chạy ví dụ

Mỗi bài có `index.html` chạy trực tiếp bằng CDN (React 16 UMD + Babel standalone — đúng chất "legacy", không cần build):

```bash
# mở file index.html bằng Live Server / trình duyệt
npx serve 2_detail/1_basic/1_expressions
```

Riêng `1_overview/` và `3_unit-test/` dùng npm hiện đại:

```bash
cd 1_overview && npm install && npm run dev
cd 3_unit-test && npm install && npm test
```

## Bảng đối chiếu nhanh AngularJS → React legacy

| AngularJS | React legacy (class) |
|---|---|
| `{{ expr }}` / `ng-bind` | `{expr}` trong JSX |
| `ng-model` | controlled component (`value` + `onChange` + `this.setState`) |
| `ng-repeat` | `arr.map(x => <li key={x.id}>)` |
| `ng-if / ng-show` | `{cond && <X/>}` / ternary |
| `ng-class / ng-style` | `className={...}` / `style={{...}}` |
| `filter` (`currency/date`) | hàm helper + `Intl.NumberFormat` / `Intl.DateTimeFormat` |
| `$http.get` | `fetch` trong `componentDidMount` |
| `controller` + `$scope` | `class X extends React.Component` + `this.state` |
| `$onInit / $onDestroy` | `componentDidMount / componentWillUnmount` |
| `service` | legacy `context` hoặc module singleton |
| `ngRoute` | `react-router-dom@5` (`<Route>`, `withRouter`) |

## Điều KHÔNG còn đúng ở React hiện đại (2026)
- **Class components** vẫn chạy nhưng không được khuyến khích; React 19 vẫn hỗ trợ để tương thích ngược.
- **`contextTypes` / `childContextTypes`** (legacy context) đã **bị gỡ** — dùng `createContext` + `useContext`.
- **String refs** (`ref="foo"`) đã bị gỡ — dùng `useRef` hoặc createRef.
- **`defaultProps` trên function component** đã bị gỡ — dùng default param.
- **`ReactDOM.render`** đã bị gỡ — dùng `createRoot` từ `react-dom/client`.
- **`react-router-dom@5`** đã cũ — dự án mới dùng React Router v7 / TanStack Router.

## Reference
- [Legacy React docs — Class components](https://legacy.reactjs.org/docs/react-component.html)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Tutorial hiện đại: `3_react-tutorial`](../3_react-tutorial)
