# React Legacy Tutorial (Class Components — thời pre-Hooks)

> ⚠️ **LEGACY — Chỉ để học/đối chiếu với AngularJS.** Hiện nay nên dùng **function components + hooks** (xem [`3_react-tutorial`](../3_react-tutorial)).
> Mọi ví dụ dưới đây cố ý dùng **class components (React 15/16 era)** để người học AngularJS dễ ánh xạ:
> `controller/$scope` → `class + this.state`, `ng-repeat` → `array.map()`, `filter` → hàm JS + `Intl`.

## Mục tiêu

Mục này nói về đích đến của toàn bộ tutorial: ai nên học, học để làm gì, và sau cùng phải rời khỏi class component như thế nào.

- Giúp người đến từ **AngularJS 1.x** ánh xạ 1-1 sang React cũ: directive ↔ JSX, two-way binding ↔ controlled component, `$http` ↔ `fetch`, service ↔ context.
- Hiểu **vì sao** React chuyển sang hooks: class khó tái sử dụng logic, `this` phức tạp, lifecycle dễ sinh bug.
- Thấy rõ khác biệt tư duy: AngularJS dùng **digest cycle + watchers**, React dùng **render lại cả cây rồi diff Virtual DOM**.

> **Tóm gọn 1 câu:** Tutorial này là "cây gậy tập đi": dùng class component để đi từ AngularJS sang React, rồi bỏ nó đi khi đã vững.

## Vì sao vẫn học phiên bản legacy?

Câu hỏi hợp lý: tại sao 2026 còn học code cũ? Mục này trả lời bằng ba lý do thực tế.

- Nhiều codebase React cũ (2015–2018) vẫn còn class component; đọc hiểu được là kỹ năng cần thiết khi bảo trì.
- Đối chiếu trực tiếp với AngularJS giúp **nhận ra pattern tương đương** thay vì học lại từ đầu.
- Tuy nhiên, **đừng viết code mới bằng class**. Sau khi học xong phần này, chuyển ngay sang `3_react-tutorial`.

Ví von: học class component giống học chữ viết tay — ngày nay ít người dùng, nhưng biết nó giúp bạn đọc được cả thư mục lưu trữ cũ mà không lúng túng.

> **Tóm gọn 1 câu:** Học legacy để *đọc* code cũ, không phải để *viết* code mới.

## Cấu trúc (đối chiếu `1_angularjs-tutorial`)

Mục này là bản đồ toàn tutorial — mỗi thư mục tương ứng một bài của AngularJS, nhìn vào là biết mình đang đứng đâu và bước tiếp theo là gì.

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

> 📄 **Code ví dụ:** [`examples/01-cach-chay-vi-du.sh`](examples/01-cach-chay-vi-du.sh)

Riêng `1_overview/` và `3_unit-test/` dùng npm hiện đại:

> 📄 **Code ví dụ:** [`examples/02-cach-chay-vi-du.sh`](examples/02-cach-chay-vi-du.sh)

## Bảng đối chiếu nhanh AngularJS → React legacy

Đây là bảng tra cứu quan trọng nhất của tutorial: khi quên "cái này trong React gọi là gì", quay về đây là ra.

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

> **Cách đọc bảng này:** cột trái là directive/API AngularJS bạn đã quen, cột phải là "tên mới" trong React — đọc theo dòng ngang như tra từ điển; khi làm bài nào thì tra đúng dòng của bài đó.

> **Tóm gọn 1 câu:** Mọi thứ bạn làm được với AngularJS đều có "tên gọi mới" trong React — bảng này là cuốn từ điển đó.

## Điều KHÔNG còn đúng ở React hiện đại (2026)

Mục này là "danh sách đồ đã lỗi thời": những gì bạn vừa học ở trên đã bị thay thế hoặc gỡ bỏ — đọc để không mang kiến thức legacy vào dự án mới.
- **Class components** vẫn chạy nhưng không được khuyến khích; React 19 vẫn hỗ trợ để tương thích ngược.
- **`contextTypes` / `childContextTypes`** (legacy context) đã **bị gỡ** — dùng `createContext` + `useContext`.
- **String refs** (`ref="foo"`) đã bị gỡ — dùng `useRef` hoặc createRef.
- **`defaultProps` trên function component** đã bị gỡ — dùng default param.
- **`ReactDOM.render`** đã bị gỡ — dùng `createRoot` từ `react-dom/client`.
- **`react-router-dom@5`** đã cũ — dự án mới dùng React Router v7 / TanStack Router.

> **Tóm gọn 1 câu:** Class component chỉ để *đọc* code cũ — 6 mục trên là những món đồ đã "nghỉ hưu", dự án mới phải dùng phiên bản thay thế tương ứng.

## Reference
- [Legacy React docs — Class components](https://legacy.reactjs.org/docs/react-component.html)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Tutorial hiện đại: `3_react-tutorial`](../3_react-tutorial)
