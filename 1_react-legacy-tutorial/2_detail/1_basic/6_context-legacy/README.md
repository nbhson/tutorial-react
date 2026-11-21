# 6. Context (legacy API)

> ⚠️ LEGACY: `childContextTypes`/`contextTypes` (React ≤16.2). Hiện nay nên dùng `React.createContext` + `useContext`.
> Đối chiếu AngularJS `7_service` (inject service dùng chung).

## Mục tiêu bài học
- Hiểu bài toán **prop drilling** và cách Context giải quyết: truyền dữ liệu xuyên nhiều tầng mà không cần props ở từng tầng.
- Đọc và hiểu được mã legacy dùng `getChildContext()` + `childContextTypes` / `contextTypes`.
- Hiểu Context giống "service dùng chung" của AngularJS nhưng theo hướng component tree.

## Khái niệm cốt lõi (Core)

Mục này giải thích bài toán "truyền dữ liệu xuyên nhiều tầng" và cách Context legacy giải nó. Đọc để hiểu nguyên lý — kể cả khi API này đã deprecated, tư duy của nó còn mãi.

- AngularJS: đăng ký `service` (VD `$http`) một lần, inject vào bất kỳ controller nào cần — không cần truyền qua từng tầng.
- React legacy context (≤ 16.2): component cha **phát** giá trị bằng `getChildContext()` + khai báo kiểu bằng `childContextTypes`; component con bất kỳ trong cây **nhận** qua `contextTypes` → đọc `this.context`. Không cần truyền props lằng nhằng qua các tầng trung gian.
- **Context** giúp tránh **prop drilling** (truyền props qua nhiều tầng): dữ liệu "ngang qua" các component trung gian mà chúng không cần. Giống service được inject thẳng, không đi qua từng controller.
- **Cập nhật**: khi state của nơi phát context đổi, `getChildContext()` trả giá trị mới — component con đăng ký nhận sẽ được render lại. Tuy nhiên legacy API có thể bị chặn cập nhật nếu một component trung gian trả `false` từ `shouldComponentUpdate` — một trong các lý do API này bị thay thế ở React 16.3+.
- Đây là API đã **deprecated**; cần thêm CDN `prop-types` (xem `index.html`) vì `childContextTypes`/`contextTypes` khai báo kiểu bằng `PropTypes`.
- **Ai dùng legacy context?** Thư viện cũ (react-router v4/v5 gốc, theme provider đời đầu) từng dùng; nay tất cả chuyển sang `createContext`.

Ví von: prop drilling giống gửi tài liệu phải xin chữ ký qua từng tầng quản lý dù các cấp trung gian không cần đọc; Context giống hệ thống thông báo nội bộ — đứng ở tầng nào cũng nhận được trực tiếp, không cần ai chuyển tay.

> **Tóm gọn 1 câu:** Context là "đài phát thanh của component cha": phát một lần, cây con đâu cũng nghe được — mà không phải truyền props qua từng tầng.

### Keyword chính
`getChildContext` · `childContextTypes` · `contextTypes` · `this.context` · `prop drilling` · `PropTypes`.

## Luồng hoạt động (Flow)

Mục này chạy ví dụ đổi theme: cha phát giá trị qua `getChildContext`, con khai báo `contextTypes` để "bắt sóng", bấm nút là cả cây đổi màu mà không một prop nào được truyền tay.

1. `index.html` nạp thêm CDN `prop-types@15` (vì context legacy khai báo kiểu bằng PropTypes).
2. `ContextDemo` mount → `constructor` đặt `theme: "dark"` → `getChildContext()` trả `{ theme: this.state.theme }`.
3. React "cấp" context cho toàn bộ cây con. `ThemeButton` khai báo `contextTypes` → React tự gán `this.context = { theme: "dark" }`.
4. `ThemeButton.render()` đọc `this.context.theme` để chọn style → hiển thị nút theo theme. KHÔNG có prop nào được truyền xuống nó.
5. Bấm "Đổi theme" → `setState({theme})` → `getChildContext()` gọi lại trả giá trị mới → các component con đọc context được render lại với theme mới.
6. Component con không hề nhận prop `theme` nào — minh chứng context "vượt tầng" thay vì truyền tay qua từng component.

**Chạy:** mở `index.html` bằng trình duyệt.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`getChildContext()`**: component cha trả về object context sẽ được chia sẻ xuống toàn cây con. Ở đây lấy từ `this.state.theme` để đổi được khi bấm nút.
- **`childContextTypes`** (gán ngoài class): khai báo "cha phát những kiểu gì" — bắt buộc, thiếu sẽ có cảnh báo React. Cần `PropTypes` từ CDN prop-types.
- **`contextTypes`** (gán ngoài class con): khai báo "con nhận những kiểu gì" — chỉ nhận đúng key được khai báo. Sau đó `this.context.theme` có giá trị.
- **Vì sao cần Context?**: nếu không có, muốn `<ThemeButton>` biết theme phải truyền `<ThemeButton theme={...} />` qua mọi tầng trung gian — đó là **prop drilling**. Context cho phép vượt tầng, giống `$injector` của AngularJS cung cấp service trực tiếp cho controller.
- **Cập nhật**: `setState({theme})` tự làm mới `getChildContext()` → component đăng ký nhận context được re-render. (Trong legacy API, việc cập nhật context có hạn chế — một trong các lý do nó bị thay bằng `createContext`.)

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này đặt service AngularJS cạnh context React để thấy cả điểm giống (dữ liệu dùng chung) lẫn điểm khác (phạm vi toàn cục vs theo cây).

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `app.service(...)` đăng ký toàn cục | Component cha `getChildContext()` phát xuống cây | Cùng "dữ liệu dùng chung" |
| Inject `MyService` vào controller | Khai báo `contextTypes` → `this.context` | Cùng kiểu khai báo "tôi cần gì" |
| `$scope` truyền binding thủ công qua directive | Prop drilling (truyền props từng tầng) | Cả hai đều rườm → context giúp bớt |
| Singleton service | Context per-tree (mỗi provider một vùng) | Context không toàn cục như service |
| — | `PropTypes` bắt buộc cho kiểu context | Thêm phụ thuộc prop-types |

> **Cách đọc bảng này:** mỗi dòng ghép một vai trò của service với cách context làm điều tương tự; dòng 4 là khác biệt lớn nhất — context gắn với một Provider trong cây chứ không toàn cục như service.

> **Tóm gọn 1 câu:** Context ≈ service AngularJS nhưng "phạm vi theo cây": phát ở Provider, nhận ở Consumer, và chỉ đọc được chứ không sửa ở con.

## Lỗi thường gặp (Common pitfalls)

Legacy context dễ lỗi nhất ở khâu "khai báo hai phía" — cha phải khai phát, con phải khai nhận, thiếu bên nào là im lặng không chạy.

- **Quên `childContextTypes` ở cha** → React cảnh báo và context không hoạt động đúng. → Luôn khai báo cả hai phía (phát + nhận).
- **Quên `contextTypes` ở con** → `this.context` rỗng, đọc `undefined`. → Con phải "xin" đúng key mới nhận.
- **Khai báo kiểu không khớp** (`theme: PropTypes.object` nhưng phát string) → cảnh báo kiểu. → Dùng đúng `PropTypes.string`.
- **Đổi context bằng `this.context.theme = ...`** → vô tác dụng, context là ngược xuôi từ cha. → Đổi `state` ở cha (nơi phát context).
- **Dùng context cho MỌI thứ** (thay cả props/state) → khó debug, khó test. → Context chỉ cho dữ liệu ít đổi (theme, locale, user), còn lại dùng props.
- **Đọc `this.context` mà không khai báo `contextTypes`** → luôn rỗng dù cha có phát. → Khai báo contextTypes ở mọi component muốn nhận.
- **Nhầm context với global mutable state** → context là read-only ở con, muốn đổi phải đổi ở cha. → Đổi state ở nơi phát.

> **Tóm gọn 1 câu:** Context legacy cần khai báo hai đầu (phát + nhận) và chỉ đọc được ở con — thiếu khai báo hoặc cố ghi từ dưới lên đều im lặng thất bại.

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

Bài số 4 ở đây đặc biệt đáng làm: tự tái hiện bug nổi tiếng của legacy context để hiểu tại sao nó bị thay thế.

1. Thêm component `Footer` ở sâu hơn (lồng thêm 1 tầng) cũng đọc `this.context.theme` — chứng minh không cần prop drilling.
2. Diễn giải cách chuyển đổi sang `React.createContext`: tạo `const ThemeContext = React.createContext("dark")`, bọc `<ThemeContext.Provider value={...}>`, đọc bằng `ThemeContext.Consumer`.
3. Thêm giá trị thứ hai `lang` vào context (vi/en) và hiển thị nhãn nút theo ngôn ngữ — luyện phát nhiều giá trị.
4. Đặt một component trung gian có `shouldComponentUpdate` trả `false` để tái hiện lỗi "context không cập nhật" của API legacy, rồi giải thích vì sao `createContext` tránh được.

## Reference
- https://legacy.reactjs.org/docs/context.html (legacy API)
- https://legacy.reactjs.org/docs/context.html#updating-context (hạn chế của update)
- https://legacy.reactjs.org/docs/typechecking-with-proptypes.html