# DAY 5: CHILDREN (SLOT / NG-CONTENT)

## Mục tiêu bài học
- Hiểu `children` là props đặc biệt của React — mọi thứ nằm giữa thẻ mở/đóng — tương đương `<ng-content>` của Angular.
- Làm chủ "named slots": thay vì `select`, dùng nhiều props kiểu `ReactNode` (header, sidebar, footer...).
- Nắm tư duy **composition > inheritance** — pattern chuẩn 2026 cho UI kit tái sử dụng.

## Khái niệm cốt lõi (Core)

### 1. `children` chỉ là một prop
Mọi JSX nằm giữa `<Card>` và `</Card>` được gói vào prop `children` và truyền vào `Card`. Không có magic — chỉ là "JSX là object, gói vào tham số hàm".

> 📄 **Code ví dụ:** [`examples/01-1-children-chi-la-mot-prop.tsx`](examples/01-1-children-chi-la-mot-prop.tsx)

Vì sao quan trọng? Vì không có "transclusion" bí ẩn — `children` tuân mọi quy tắc props: read-only, snapshot mỗi render, type-check được. Component con chỉ `return <div>{children}</div>` là xong. Nếu bạn quên khai `children` trong type, TS báo thiếu prop khi có con, hoặc `children` là `undefined` khi không có con mà bạn vẫn render wrapper rỗng.

> **Tóm gọn 1 câu:** `children` chỉ là một prop có tên đặc biệt: mọi thứ giữa 2 thẻ được gói lại và đưa vào — hết.

### 2. `ReactNode` là kiểu dành cho children
Gồm element, string, number, fragment, array, `null`, boolean (`boolean`/`null` bị bỏ qua khi render nhưng vẫn là `ReactNode` hợp lệ).

> 📄 **Code ví dụ:** [`examples/02-2-reactnode-la-kieu-danh-cho-children.tsx`](examples/02-2-reactnode-la-kieu-danh-cho-children.tsx)

Vì sao không `string` hay `JSX.Element` hẹp? Vì `string` loại trừ element, `JSX.Element` loại trừ string/mảng/null — `ReactNode` rộng đúng ý "khe chèn bất kỳ nội dung vẽ được". Muốn hẹp (chỉ cho 1 element) mới dùng `ReactElement`; muốn bắt buộc có con thì `children: ReactNode` vẫn cho `undefined` nên cần runtime check hoặc type custom.

> **Tóm gọn 1 câu:** `ReactNode` là kiểu "mở cửa cho mọi thứ vẽ được" — muốn giới hạn khe chèn thì thu hẹp thành `ReactElement`, nhưng phải cân nhắc.

### 3. Named slots — nhiều props `ReactNode`
Angular dùng `<ng-content select="[slot=header]">` để chọn khe theo selector. React **không có select** — bạn tự định nghĩa nhiều props (`header`, `sidebar`, `footer`). Lợi ích: type-check từng slot, IDE gợi ý, rõ nơi nào chèn gì.

> 📄 **Code ví dụ:** [`examples/03-3-named-slots-nhieu-props-reactnode.tsx`](examples/03-3-named-slots-nhieu-props-reactnode.tsx)

Vì sao props có tên thắng `select`? Vì `select="[slot=header]"` là string khớp lúc runtime, sai chính tả không ai báo. Props có tên sai thì TS báo ngay, refactor đổi tên thì IDE sửa hết. Quy ước: `children` cho slot lớn nhất (main/body), props `ReactNode` cho slot phụ (header/footer/aside).

> **Tóm gọn 1 câu:** Named slots = mỗi khe một prop `ReactNode` có tên: TS bắt lỗi ngay, IDE gợi ý — không còn string selector sai ngầm.

### 4. Composition > inheritance
Đừng thừa kế component (không tồn tại trong React function, không có `extends`). Hãy **bọc** (`<Card><SpecialContent /></Card>`) hoặc cấu hình qua props. Muốn biến thể, thêm props/slot chứ không tạo subclass.

> 📄 **Code ví dụ:** [`examples/04-4-composition-inheritance.tsx`](examples/04-4-composition-inheritance.tsx)

Vì sao composition thắng? Vì bọc không vỡ khi cha đổi nội bộ (Card đổi viền không ảnh hưởng nội dung), kết hợp nhiều lớp không giới hạn (`Layout > Card > Panel`), mỗi lớp chỉ lo layout của mình (inversion of control: cha quyết nội dung, con quyết khung).

> **Tóm gọn 1 câu:** Composition là "xếp lớp hộp quà": mỗi lớp chỉ lo khung của mình, nội dung do người bọc quyết — không cần `extends` nào cả.

### 5. Children là dữ liệu bất biến
Component con chỉ render, không mutate `children`. Muốn đếm/sửa/inject prop vào children (đánh số Steps, thêm onClick hàng loạt) → `Children` API (DAY 9). Đừng `children.push()` hay gán `children.props`.

> 📄 **Code ví dụ:** [`examples/05-5-children-la-du-lieu-bat-bien.tsx`](examples/05-5-children-la-du-lieu-bat-bien.tsx)

> **Tóm gọn 1 câu:** Children là hàng trưng bày trong tủ kính: con chỉ render, không mutate — muốn đếm/sửa thì dùng `Children` API (DAY 9).

### 6. Render children sớm/lười — ý nghĩa với memo
Children được tạo *trước* khi component con render (ở cha). Khi con re-render vì state riêng mà cha không render lại, `children` cũ (object từ props) được tái sử dụng — React không dựng lại cây con. Ngược lại cha re-render thì mọi JSX đánh giá lại → element mới → diff.

Vì sao cần biết? Vì đây là lý do "children ổn định giúp memo hiệu quả": tách phần ít đổi thành `children` truyền từ cha ít render, con hay render không kéo theo. Tránh prop-drilling children qua 4-5 tầng — mỗi tầng trung gian vẫn re-render dù chỉ "chuyển tiếp". Ví von: children như món quà đã gói sẵn từ nhà cha — con chỉ mở xem, không bọc lại.

> **Tóm gọn 1 câu:** Children được gói xong trước ở cha rồi mới đưa con — con re-render vì state riêng không bọc lại món quà này.

### Keyword chính
`children`, `ReactNode` (rộng) vs `ReactElement` (hẹp 1 element), `slot`, `ng-content` ↔ `{children}`, `composition`, `named slots`, `layout`, `fallback` (`??`).

## Luồng hoạt động (Flow)
Mục này đi qua 10 bước theo đúng vòng đời của một trang có Layout + Card + Panel: từ lúc cha gói JSX, con phân bổ slot, tới khi state đổi ai re-render ai.
1. `App` render JSX `<Layout header={<h2>.../>} sidebar={<nav>Menu</nav>}>...<Card>...</Card>...</Layout>`. React đánh giá từng JSX con thành ReactNode trước.
2. `header` = element `<h2>`, `sidebar` = element `<nav>`, và mọi thứ giữa `<Layout>` `</Layout>` (gồm `<Card>` + 2 `<Panel>`) gom thành mảng `children` của Layout.
3. `Layout` render: đặt `header` vào `<header>`, `sidebar` vào `<aside>`, `children` vào `<main>`. Con quyết vị trí, cha quyết nội dung — inversion of control.
4. Trong `<Card>`, `children` = 2x `<p>`; Card render chúng trong div viền. Trong `<Panel title="Không footer">`, `footer` là `undefined` nên `{footer ?? <small>...}` vẽ fallback.
5. React dựng DOM; cha kiểm soát nội dung, con kiểm soát khung. Không có "project" runtime như Angular — chỉ là truyền object props.
6. Khi state cha (`App`) đổi và re-render, mọi JSX đánh giá lại → element mới; React diff theo vị trí/type/key, chỉ chạm DOM thật sự khác.
7. Khi `Layout` re-render vì state riêng (nếu có) mà `App` không render lại, `children` cũ từ props được tái sử dụng — không dựng lại cây con. Đây là lợi ích memo tự nhiên của children.
8. Nếu cần named slots thêm (`footer`, `toolbar`), thêm prop `ReactNode` là xong — không cần directive mới.
9. Khi children là hàm (render props), con gọi hàm để lấy JSX (DAY 6) — vẫn là `children`, chỉ khác kiểu (function thay element).
10. Kiểm tra "có con hay không" bằng `Boolean(children)` hoặc `Children.count(children) > 0` để tránh xuất `<div>` bọc rỗng lệch layout.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục:

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- Dòng `import type { ReactNode }`: `import type` (không mang runtime) vì `ReactNode` chỉ là type. Vì sao `ReactNode` mà không `JSX.Element`? Vì `ReactNode` chấp nhận string (`<Card>Xin chào</Card>`), mảng, `null` — đúng ý slot nhận bất kỳ nội dung vẽ được.
- Khối `function Card({ children })`: destructure prop đặc biệt. Card không biết nội dung — chỉ quyết khung (viền/padding/bo góc). Muốn đổi nội dung không sửa Card, chỉ đổi nơi dùng. Đây là inversion of control.
- Dòng `<div style={{...}}>{children}</div>`: style object minh họa layout do con quyết. `{children}` đặt đúng vị trí nội dung. Đổi vị trí dòng này là đổi layout mà không đụng nội dung.
- Khối `Layout({ header, sidebar, children })`: tương đương 3 `<ng-content select>`. Vì sao 3 props mà không 1 `children` rồi `select`? Vì props có tên được TS check, IDE gợi ý, refactor an toàn. Mỗi slot một trách nhiệm (`header`/`sidebar`/`main`).
- Dòng `<Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>`: JSX truyền qua attribute (`header`/`sidebar`) và qua nội dung (`children`) — cùng là ReactNode, chỉ khác cú pháp. Slot chính (lớn) để ở children cho tự nhiên; slot phụ để ở attribute cho gọn.
- Lồng composition `Card` trong `children` của `Layout`: composition xếp chồng không giới hạn, không cần kế thừa. Mỗi lớp bọc thêm một khung mà không biết nội bộ lớp trong.
- Khối `Panel({ title, children, footer })`: `footer?: ReactNode` optional (có `?`). Vì sao optional? Vì không phải panel nào cũng có action. Bắt buộc sẽ ép mọi nơi dùng phải truyền footer giả.
- Dòng `{footer ?? <small>Nội dung mặc định</small>}`: `??` (nullish) chỉ fallback khi `null`/`undefined`, giữ `false`/`0` nếu ai đó cố ý truyền. Khác `||` (fallback cả `""`/`0`/`false`). Đây là cách React làm "projector fallback" mà Angular có sẵn.
- Quy tắc **truyền children qua nội dung hay attribute?** Nội dung (`<Card>...`) tự nhiên cho slot chính; attribute (`header={...}`) cho slot phụ. `<Card children={<p/>} />` vẫn chạy nhưng khó đọc — chỉ dùng khi cần pass-through lập trình.
- Quy tắc **children không re-render khi con re-render**: children tạo ở cha; con re-render vì state riêng không tạo lại children. Ngược lại cha re-render thì children mới. Đặt state đúng tầng để tận dụng.
- Quy tắc **type hẹp khi cần**: `children: ReactElement` nếu chỉ cho 1 element (ví dụ Tooltip chỉ bọc 1 trigger); `children: ReactNode` cho slot chung. Hẹp sai sẽ chặn string hợp lệ — chọn đúng độ rộng.
- Quy tắc **kiểm tra rỗng**: `Boolean(children)` nhanh cho 1 con; `Children.count(children) > 0` đúng cho mọi shape (1 element/mảng/fragment). Dùng để quyết định có render wrapper `<div>` không — tránh `<div>` rỗng lệch layout.

## Bảng so sánh Angular ↔ React
Mục này dịch từng khái niệm projection của Angular sang React — nhìn cột phải sẽ thấy React "gỡ bỏ" directive/selector/template để chỉ còn props.
| Angular | React | Ghi chú |
|---|---|---|
| `<ng-content>` | `{children}` | Cùng "khe chèn nội dung từ cha", React chỉ là prop |
| `<ng-content select="[slot=header]">` | prop `{header}` kiểu `ReactNode` | Props riêng có type thay vì selector string |
| `<ng-container>` | `<>...</>` fragment | Không thêm DOM wrapper, chỉ nhóm |
| `<ng-template>` + `*ngTemplateOutlet` | render props / component prop (DAY 6) | Render linh hoạt theo function, không cần template ref |
| Transclusion tĩnh | `children` + conditional render (`??`, `&&`) | React lọc/đếm/tra cứu lúc render (DAY 9) |
| Thừa kế component (`extends`) | Composition (bọc) | Function không kế thừa, chỉ bọc |
| `@ContentChild` đọc projected | `Children` API (DAY 9) | Traversal lúc render, không lifecycle riêng |
| `projectAs` alias | props `ReactNode` có tên khác nhau | Không có alias node, tên prop chính là alias |
| `ng-content` với fallback | `children ?? <Default/>` / `footer ?? <Default/>` | React tự viết fallback bằng `??` |
| `@HostBinding`/`@HostListener` trên host | props + `children` của component, style/class qua props | React không có host element ẩn |

> **Cách đọc bảng này:** mỗi dòng là một cặp cũ ↔ mới; 3 dòng đầu là những gì bạn dùng 90% thời gian (`children`, named props, fragment) — phần còn lại là trường hợp nâng cao, chỉ quay lại khi cần.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 7 cái bẫy của children — hầu hết xuất phát từ hai rễ: "coi children là mảng thường" và "coi children luôn tồn tại".

### 1. Quên khai type `children`
> 📄 **Code ví dụ:** [`examples/07-1-quen-khai-type-children.tsx`](examples/07-1-quen-khai-type-children.tsx)
> 📄 **Code ví dụ:** [`examples/08-1-quen-khai-type-children.tsx`](examples/08-1-quen-khai-type-children.tsx)

### 2. Nhầm `children` luôn tồn tại
> 📄 **Code ví dụ:** [`examples/09-2-nham-children-luon-ton-tai.tsx`](examples/09-2-nham-children-luon-ton-tai.tsx)
> 📄 **Code ví dụ:** [`examples/10-2-nham-children-luon-ton-tai.tsx`](examples/10-2-nham-children-luon-ton-tai.tsx)

### 3. Đặt children trong attribute cho slot chính
> 📄 **Code ví dụ:** [`examples/11-3-at-children-trong-attribute-cho-slot-chinh.tsx`](examples/11-3-at-children-trong-attribute-cho-slot-chinh.tsx)
> 📄 **Code ví dụ:** [`examples/12-3-at-children-trong-attribute-cho-slot-chinh.tsx`](examples/12-3-at-children-trong-attribute-cho-slot-chinh.tsx)

### 4. Lạm dụng prop-drilling cho slot sâu
Mô tả: `App > Page > Layout > Card` truyền `header` qua 3 tầng trung gian không dùng. Fix: tách Layout tại nơi dùng (đặt `<Layout>` gần `App`), hoặc Context cho config (theme/locale), không drilling slot.

### 5. Muốn đếm/sửa children bằng API mảng thường
> 📄 **Code ví dụ:** [`examples/13-5-muon-em-sua-children-bang-api-mang.tsx`](examples/13-5-muon-em-sua-children-bang-api-mang.tsx)
> 📄 **Code ví dụ:** [`examples/14-5-muon-em-sua-children-bang-api-mang.tsx`](examples/14-5-muon-em-sua-children-bang-api-mang.tsx)

### 6. Truyền `false` làm vỡ layout
Mô tả: `{show && <Card/>}` với `show = false` thì children là `false` (bị bỏ qua) — Card không vẽ, khoảng layout mất. Nếu Card luôn cần khung, truyền `null` + fallback hoặc giữ Card và điều kiện bên trong.
> 📄 **Code ví dụ:** [`examples/15-6-truyen-false-lam-vo-layout.tsx`](examples/15-6-truyen-false-lam-vo-layout.tsx)
> 📄 **Code ví dụ:** [`examples/16-6-truyen-false-lam-vo-layout.tsx`](examples/16-6-truyen-false-lam-vo-layout.tsx)

### 7. Giả định `children` có `.map`/`.length`
Như mục 5 — coi `children` là `ReactNode` mờ; cần duyệt thì `Children` API (DAY 9). Đặc biệt khi children là function (render props DAY 6), `Children.map` trả function, không render được — phải tách trường hợp (kiểm tra `typeof children === "function"`).

## Best practices / Mẹo
- **Thiết kế component theo slots trước**, sau đó tới state/logic — Card tốt là "khung" với children. Vì sao? Vì slot quyết định API tái dùng; logic đổi theo slot chứ không ngược lại.
- Dùng **compound components + context** (DAY 6) khi nhiều slot chia sẻ state (Tabs, Accordion). Vì sao? Vì 5 props `value/onChange` drilling qua 3 lớp slot rối hơn 1 Provider ngầm.
- Nếu layout ăn nhiều `ReactNode` props, gộp config hoặc tách nhỏ — tránh "props quá khổ" 8-10 slot. Vì sao? Vì component 10 slot khó nhớ, dễ truyền sai vị trí.
- Đặt default cho slot phụ (`footer?`) để dùng được mà không truyền đủ. Vì sao? Để 80% nơi dùng gọn, 20% cần mới truyền.
- Giữ tên slot nhất quán (`header`/`body`/`footer`, `title`/`actions`) giữa các component. Vì sao? Để chuyển từ `Dialog` sang `Drawer` không phải học lại tên.
- **Đặt `children` cuối interface props** cho dễ đọc và khớp thói quen viết JSX (nội dung ở giữa thẻ). Vì sao? Vì đọc type từ trên xuống như đọc JSX từ ngoài vào trong.
- Nếu nhiều slot, `children` cho slot lớn nhất, props cho slot còn lại. Vì sao? Vì slot lớn viết inline tự nhiên nhất, slot nhỏ gọn ở attribute.

> **Tóm gọn 1 câu:** Thiết kế theo slot trước, logic sau: `children` là cửa chính, named props là cửa sổ — và luôn nhớ children là dữ liệu bất biến truyền từ cha.

## Bài tập nhỏ
1. Thêm 2 slot mới vào `Layout` (`footer`, `toolbar`) và truyền nội dung tương ứng — kiểm tra thứ tự render và fallback khi thiếu.
2. Tạo `Dialog` nhận `title`, `actions` (ReactNode), `children`; dùng 2 chỗ với nội dung khác nhau. Vì sao `actions` là ReactNode mà không phải `(onClose: () => void) => ReactNode`?
3. Viết `Tabs` (tĩnh) nhận slot `tabList` + `children` cho panel. Khi nào cần nâng lên compound + context (DAY 6)?
4. Tạo `Page` nhận `title` + `children` + `aside?` với default null. Kiểm tra `<Page>` không `aside` vẫn layout đúng (không `<aside>` rỗng).
5. Truyền `children` là chuỗi (`<Card>Xin chào</Card>`) và mảng (`<Card>{["a", "b"]}</Card>`) — quan sát `ReactNode` chấp nhận cả hai và cách render khác nhau thế nào.

## Reference
- https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
- https://react.dev/reference/react/Children
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/react/typescript
