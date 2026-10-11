# 6. Context (legacy API)

> ⚠️ LEGACY: `childContextTypes`/`contextTypes` (React ≤16.2). Hiện nay nên dùng `React.createContext` + `useContext`.
> Đối chiếu AngularJS `7_service` (inject service dùng chung).

## Mục tiêu bài học
- Hiểu bài toán **prop drilling** và cách Context giải quyết: truyền dữ liệu xuyên nhiều tầng mà không cần props ở từng tầng.
- Đọc và hiểu được mã legacy dùng `getChildContext()` + `childContextTypes` / `contextTypes`.
- Hiểu Context giống "service dùng chung" của AngularJS nhưng theo hướng component tree.

## Khái niệm cốt lõi (Core)
- AngularJS: đăng ký `service` (VD `$http`) một lần, inject vào bất kỳ controller nào cần — không cần truyền qua từng tầng.
- React legacy context (≤ 16.2): component cha **phát** giá trị bằng `getChildContext()` + khai báo kiểu bằng `childContextTypes`; component con bất kỳ trong cây **nhận** qua `contextTypes` → đọc `this.context`. Không cần truyền props lằng nhằng qua các tầng trung gian.
- **Context** giúp tránh **prop drilling** (truyền props qua nhiều tầng): dữ liệu "ngang qua" các component trung gian mà chúng không cần. Giống service được inject thẳng, không đi qua từng controller.
- **Cập nhật**: khi state của nơi phát context đổi, `getChildContext()` trả giá trị mới — component con đăng ký nhận sẽ được render lại. Tuy nhiên legacy API có thể bị chặn cập nhật nếu một component trung gian trả `false` từ `shouldComponentUpdate` — một trong các lý do API này bị thay thế ở React 16.3+.
- Đây là API đã **deprecated**; cần thêm CDN `prop-types` (xem `index.html`) vì `childContextTypes`/`contextTypes` khai báo kiểu bằng `PropTypes`.
- **Ai dùng legacy context?** Thư viện cũ (react-router v4/v5 gốc, theme provider đời đầu) từng dùng; nay tất cả chuyển sang `createContext`.

### Keyword chính
`getChildContext` · `childContextTypes` · `contextTypes` · `this.context` · `prop drilling` · `PropTypes`.

## Luồng hoạt động (Flow)
1. `index.html` nạp thêm CDN `prop-types@15` (vì context legacy khai báo kiểu bằng PropTypes).
2. `ContextDemo` mount → `constructor` đặt `theme: "dark"` → `getChildContext()` trả `{ theme: this.state.theme }`.
3. React "cấp" context cho toàn bộ cây con. `ThemeButton` khai báo `contextTypes` → React tự gán `this.context = { theme: "dark" }`.
4. `ThemeButton.render()` đọc `this.context.theme` để chọn style → hiển thị nút theo theme. KHÔNG có prop nào được truyền xuống nó.
5. Bấm "Đổi theme" → `setState({theme})` → `getChildContext()` gọi lại trả giá trị mới → các component con đọc context được render lại với theme mới.
6. Component con không hề nhận prop `theme` nào — minh chứng context "vượt tầng" thay vì truyền tay qua từng component.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
```jsx
// LEGACY context API (childContextTypes/contextTypes) — đối chiếu AngularJS service.
// Hiện nay: dùng React.createContext + useContext.
class ThemeButton extends React.Component {
  render() {
    const theme = this.context.theme; // ↔ service được inject: đọc trực tiếp, không qua props
    const style = theme === "dark"
      ? { background: "#333", color: "#fff", padding: "8px 16px" }
      : { background: "#eee", color: "#000", padding: "8px 16px" };
    return <button style={style}>Nút theme: {theme}</button>;
  }
}
// Component con khai báo KIỂU context nó muốn nhận — bắt buộc với legacy API
ThemeButton.contextTypes = { theme: PropTypes.string };

class ContextDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { theme: "dark" };
    this.toggle = this.toggle.bind(this);
  }
  getChildContext() {
    return { theme: this.state.theme }; // phát giá trị cho cả cây con
  }
  toggle() {
    this.setState(function (prev) {
      return { theme: prev.theme === "dark" ? "light" : "dark" };
    });
  }
  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Legacy Context (≈ service)</h2>
        <p><button onClick={this.toggle}>Đổi theme</button></p>
        {/* Không truyền props mà ThemeButton vẫn đọc được theme */}
        <ThemeButton />
      </div>
    );
  }
}
// Component "phát" phải khai báo childContextTypes — nếu thiếu sẽ cảnh báo
ContextDemo.childContextTypes = { theme: PropTypes.string };
```

## Giải thích từng phần
- **`getChildContext()`**: component cha trả về object context sẽ được chia sẻ xuống toàn cây con. Ở đây lấy từ `this.state.theme` để đổi được khi bấm nút.
- **`childContextTypes`** (gán ngoài class): khai báo "cha phát những kiểu gì" — bắt buộc, thiếu sẽ có cảnh báo React. Cần `PropTypes` từ CDN prop-types.
- **`contextTypes`** (gán ngoài class con): khai báo "con nhận những kiểu gì" — chỉ nhận đúng key được khai báo. Sau đó `this.context.theme` có giá trị.
- **Vì sao cần Context?**: nếu không có, muốn `<ThemeButton>` biết theme phải truyền `<ThemeButton theme={...} />` qua mọi tầng trung gian — đó là **prop drilling**. Context cho phép vượt tầng, giống `$injector` của AngularJS cung cấp service trực tiếp cho controller.
- **Cập nhật**: `setState({theme})` tự làm mới `getChildContext()` → component đăng ký nhận context được re-render. (Trong legacy API, việc cập nhật context có hạn chế — một trong các lý do nó bị thay bằng `createContext`.)

## So sánh AngularJS ↔ React (bảng markdown)
| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `app.service(...)` đăng ký toàn cục | Component cha `getChildContext()` phát xuống cây | Cùng "dữ liệu dùng chung" |
| Inject `MyService` vào controller | Khai báo `contextTypes` → `this.context` | Cùng kiểu khai báo "tôi cần gì" |
| `$scope` truyền binding thủ công qua directive | Prop drilling (truyền props từng tầng) | Cả hai đều rườm → context giúp bớt |
| Singleton service | Context per-tree (mỗi provider một vùng) | Context không toàn cục như service |
| — | `PropTypes` bắt buộc cho kiểu context | Thêm phụ thuộc prop-types |

## Lỗi thường gặp (Common pitfalls)
- **Quên `childContextTypes` ở cha** → React cảnh báo và context không hoạt động đúng. → Luôn khai báo cả hai phía (phát + nhận).
- **Quên `contextTypes` ở con** → `this.context` rỗng, đọc `undefined`. → Con phải "xin" đúng key mới nhận.
- **Khai báo kiểu không khớp** (`theme: PropTypes.object` nhưng phát string) → cảnh báo kiểu. → Dùng đúng `PropTypes.string`.
- **Đổi context bằng `this.context.theme = ...`** → vô tác dụng, context là ngược xuôi từ cha. → Đổi `state` ở cha (nơi phát context).
- **Dùng context cho MỌI thứ** (thay cả props/state) → khó debug, khó test. → Context chỉ cho dữ liệu ít đổi (theme, locale, user), còn lại dùng props.
- **Đọc `this.context` mà không khai báo `contextTypes`** → luôn rỗng dù cha có phát. → Khai báo contextTypes ở mọi component muốn nhận.
- **Nhầm context với global mutable state** → context là read-only ở con, muốn đổi phải đổi ở cha. → Đổi state ở nơi phát.

## Best practices / Mẹo
- Đây là API đã deprecated: khi gặp trong code cũ, hiểu nguyên lý rồi dịch sang `React.createContext` (hoặc `useContext`).
- Nếu viết mới, đừng dùng `childContextTypes` — nó từng gây "update blocked" khi component ở giữa trả về `false` cho `shouldComponentUpdate`.
- Giữ giá trị context ổn định (theme, language) — không để dữ liệu tần suất đổi cao đi qua context.
- Context chỉ nên chứa dữ liệu "toàn cục theo vùng" (theme, auth, i18n); dữ liệu riêng của một nhánh vẫn nên là props.
- Khi dịch sang `createContext`, giữ nguyên API đọc (`ThemeContext.Consumer` trả `theme`) để ít phải sửa component con.
- Không dùng context để "cứu" mọi prop drilling: nếu chỉ truyền 1-2 tầng, props thường vẫn rõ ràng hơn.
- Với dữ liệu đổi thường xuyên, context legacy dễ gây render thừa — cân nhắc `createContext` + tách component tiêu thụ.
- Nhớ rằng context là *read-only* ở con: muốn đổi, đổi state ở component phát rồi context lan xuống.

## Bài tập nhỏ
1. Thêm component `Footer` ở sâu hơn (lồng thêm 1 tầng) cũng đọc `this.context.theme` — chứng minh không cần prop drilling.
2. Diễn giải cách chuyển đổi sang `React.createContext`: tạo `const ThemeContext = React.createContext("dark")`, bọc `<ThemeContext.Provider value={...}>`, đọc bằng `ThemeContext.Consumer`.
3. Thêm giá trị thứ hai `lang` vào context (vi/en) và hiển thị nhãn nút theo ngôn ngữ — luyện phát nhiều giá trị.
4. Đặt một component trung gian có `shouldComponentUpdate` trả `false` để tái hiện lỗi "context không cập nhật" của API legacy, rồi giải thích vì sao `createContext` tránh được.

## Reference
- https://legacy.reactjs.org/docs/context.html (legacy API)
- https://legacy.reactjs.org/docs/context.html#updating-context (hạn chế của update)
- https://legacy.reactjs.org/docs/typechecking-with-proptypes.html