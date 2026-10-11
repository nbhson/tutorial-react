# DAY 5: CHILDREN (SLOT / NG-CONTENT)

## Mục tiêu bài học
- Hiểu `children` là props đặc biệt của React — mọi thứ nằm giữa thẻ mở/đóng — tương đương `<ng-content>` của Angular.
- Làm chủ "named slots": thay vì `select`, dùng nhiều props kiểu `ReactNode` (header, sidebar, footer...).
- Nắm tư duy **composition > inheritance** — pattern chuẩn 2026 cho UI kit tái sử dụng.

## Khái niệm cốt lõi (Core)

### 1. `children` chỉ là một prop
Mọi JSX nằm giữa `<Card>` và `</Card>` được gói vào prop `children` và truyền vào `Card`. Không có magic — chỉ là "JSX là object, gói vào tham số hàm".

```tsx
// Bạn viết:
<Card><p>Hi</p></Card>

// React hiểu gần tương đương:
Card({ children: jsx("p", { children: "Hi" }) });
// Card nhận object props, trong đó children là element <p>
```

Vì sao quan trọng? Vì không có "transclusion" bí ẩn — `children` tuân mọi quy tắc props: read-only, snapshot mỗi render, type-check được. Component con chỉ `return <div>{children}</div>` là xong. Nếu bạn quên khai `children` trong type, TS báo thiếu prop khi có con, hoặc `children` là `undefined` khi không có con mà bạn vẫn render wrapper rỗng.

### 2. `ReactNode` là kiểu dành cho children
Gồm element, string, number, fragment, array, `null`, boolean (`boolean`/`null` bị bỏ qua khi render nhưng vẫn là `ReactNode` hợp lệ).

```tsx
import type { ReactNode } from "react";
function Card({ children }: { children: ReactNode }) {
  return <div style={{ border: "1px solid #ccc", padding: 12 }}>{children}</div>;
}
// Cả 3 cách đều hợp lệ vì đều là ReactNode:
<Card>Xin chào</Card> // string
<Card>{["a", "b"]}</Card> // mảng
<Card><p>Hi</p></Card> // element
```

Vì sao không `string` hay `JSX.Element` hẹp? Vì `string` loại trừ element, `JSX.Element` loại trừ string/mảng/null — `ReactNode` rộng đúng ý "khe chèn bất kỳ nội dung vẽ được". Muốn hẹp (chỉ cho 1 element) mới dùng `ReactElement`; muốn bắt buộc có con thì `children: ReactNode` vẫn cho `undefined` nên cần runtime check hoặc type custom.

### 3. Named slots — nhiều props `ReactNode`
Angular dùng `<ng-content select="[slot=header]">` để chọn khe theo selector. React **không có select** — bạn tự định nghĩa nhiều props (`header`, `sidebar`, `footer`). Lợi ích: type-check từng slot, IDE gợi ý, rõ nơi nào chèn gì.

```tsx
// Layout trong example.tsx: 3 khe tường minh
function Layout({ header, sidebar, children }: { header: ReactNode; sidebar: ReactNode; children: ReactNode }) {
  return (
    <div>
      <header>{header}</header>
      <div style={{ display: "flex", gap: 12 }}>
        <aside>{sidebar}</aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
// Dùng: slot phụ qua attribute, slot chính qua children
<Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
  <Card><p>Nội dung qua children.</p></Card>
</Layout>
```

Vì sao props có tên thắng `select`? Vì `select="[slot=header]"` là string khớp lúc runtime, sai chính tả không ai báo. Props có tên sai thì TS báo ngay, refactor đổi tên thì IDE sửa hết. Quy ước: `children` cho slot lớn nhất (main/body), props `ReactNode` cho slot phụ (header/footer/aside).

### 4. Composition > inheritance
Đừng thừa kế component (không tồn tại trong React function, không có `extends`). Hãy **bọc** (`<Card><SpecialContent /></Card>`) hoặc cấu hình qua props. Muốn biến thể, thêm props/slot chứ không tạo subclass.

```tsx
// ❌ Tư duy kế thừa (không tồn tại trong React function)
class SpecialCard extends Card {} // không làm thế này

// ✅ Tư duy composition: bọc + slot
<Card><p>Nội dung đặc biệt</p></Card>
<Panel title="Có footer" footer={<button>Lưu</button>}><p>Body</p></Panel>
```

Vì sao composition thắng? Vì bọc không vỡ khi cha đổi nội bộ (Card đổi viền không ảnh hưởng nội dung), kết hợp nhiều lớp không giới hạn (`Layout > Card > Panel`), mỗi lớp chỉ lo layout của mình (inversion of control: cha quyết nội dung, con quyết khung).

### 5. Children là dữ liệu bất biến
Component con chỉ render, không mutate `children`. Muốn đếm/sửa/inject prop vào children (đánh số Steps, thêm onClick hàng loạt) → `Children` API (DAY 9). Đừng `children.push()` hay gán `children.props`.

```tsx
// ❌ SAI: mutate children
children.push(<p>Mới</p>); // children có thể không phải mảng — crash

// ✅ ĐÚNG: bọc thêm (composition) hoặc dùng Children API
<Card>{children}<p>Thêm bằng bọc, không sửa gốc</p></Card>
// Hoặc DAY 9: Children.map(children, (c, i) => <li>Bước {i+1}: {c}</li>)
```

### 6. Render children sớm/lười — ý nghĩa với memo
Children được tạo *trước* khi component con render (ở cha). Khi con re-render vì state riêng mà cha không render lại, `children` cũ (object từ props) được tái sử dụng — React không dựng lại cây con. Ngược lại cha re-render thì mọi JSX đánh giá lại → element mới → diff.

Vì sao cần biết? Vì đây là lý do "children ổn định giúp memo hiệu quả": tách phần ít đổi thành `children` truyền từ cha ít render, con hay render không kéo theo. Tránh prop-drilling children qua 4-5 tầng — mỗi tầng trung gian vẫn re-render dù chỉ "chuyển tiếp".

### Keyword chính
`children`, `ReactNode` (rộng) vs `ReactElement` (hẹp 1 element), `slot`, `ng-content` ↔ `{children}`, `composition`, `named slots`, `layout`, `fallback` (`??`).

## Luồng hoạt động (Flow)
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

```tsx
// example.tsx — DAY 5: children + named slots + fallback (khớp README 1-1)
// Mục đích: cha quyết nội dung, con quyết layout — composition thay inheritance.
import type { ReactNode } from "react"; // (1) Type cho mọi nội dung chèn được: element, string, số, mảng, null

// (2) Card: layout do Card quyết (viền + padding), nội dung do cha đưa qua children.
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      {children} {/* (3) Chèn nội dung cha đưa — Card không cần biết cụ thể là gì */}
    </div>
  );
}

// (4) Layout: 3 "khe" tường minh — header, sidebar (named slots), children (main).
// Thay cho <ng-content select="..."> của Angular: mỗi slot là một prop ReactNode có tên.
function Layout({ header, sidebar, children }: { header: ReactNode; sidebar: ReactNode; children: ReactNode }) {
  return (
    <div>
      <header>{header}</header> {/* (5) Slot header vào <header> */}
      <div style={{ display: "flex", gap: 12 }}>
        <aside>{sidebar}</aside> {/* (6) Slot sidebar vào <aside> */}
        <main>{children}</main> {/* (7) Slot chính vào <main> */}
      </div>
    </div>
  );
}

// (8) Panel: slot phụ tùy chọn (footer?) + fallback khi cha không truyền.
function Panel({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
      {/* (9) ?? fallback: không có footer thì hiện mặc định — thay projector fallback của Angular */}
      {footer ?? <small>Nội dung mặc định</small>}
    </section>
  );
}

export default function App() {
  return (
    <Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
      {/* (10) Mọi JSX ở đây thành children của Layout — lồng Card trong Layout (composition chồng) */}
      <Card>
        <p>Nội dung qua children.</p>
        <p>Nội dung 2 qua children.</p>
      </Card>
      {/* (11) Panel có footer + Panel dùng fallback — minh họa slot optional */}
      <Panel title="Có footer" footer={<button>Lưu</button>}>
        <p>Body panel 1</p>
      </Panel>
      <Panel title="Không footer">
        <p>Body panel 2 — footer rơi về mặc định</p>
      </Panel>
    </Layout>
  );
}
```

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

## Lỗi thường gặp (Common pitfalls)

### 1. Quên khai type `children`
```tsx
// ❌ SAI: TS any/implicit, mất gợi ý, dễ truyền object lạ
function Card({ children }: any) { return <div>{children}</div>; }
```
```tsx
// ✅ ĐÚNG: ReactNode rộng đúng ý slot
import type { ReactNode } from "react";
function Card({ children }: { children: ReactNode }) { return <div>{children}</div>; }
```

### 2. Nhầm `children` luôn tồn tại
```tsx
// ❌ SAI: luôn render wrapper dù không có con — <div> rỗng lệch layout
function Card({ children }: { children?: ReactNode }) { return <div className="card">{children}</div>; }
<Card /> // <div class="card"></div> rỗng
```
```tsx
// ✅ ĐÚNG: check hoặc fallback
function Card({ children }: { children?: ReactNode }) {
  if (!children) return null; // hoặc render fallback
  return <div className="card">{children}</div>;
}
```

### 3. Đặt children trong attribute cho slot chính
```tsx
// ❌ SAI: chạy nhưng khó đọc, mất ý "bọc"
<Card children={<p>Hi</p>} />
```
```tsx
// ✅ ĐÚNG: lồng inline cho slot chính, attribute cho slot phụ
<Card><p>Hi</p></Card>
<Layout header={<h2>Hi</h2>} sidebar={<nav />}><p>Main</p></Layout>
```

### 4. Lạm dụng prop-drilling cho slot sâu
Mô tả: `App > Page > Layout > Card` truyền `header` qua 3 tầng trung gian không dùng. Fix: tách Layout tại nơi dùng (đặt `<Layout>` gần `App`), hoặc Context cho config (theme/locale), không drilling slot.

### 5. Muốn đếm/sửa children bằng API mảng thường
```tsx
// ❌ SAI: children có thể là 1 element/string, không có .map/.length — crash
children.map((c) => ...); children.length;
```
```tsx
// ✅ ĐÚNG: Children API chuẩn hóa mọi shape (chi tiết DAY 9)
import { Children } from "react";
Children.count(children); Children.map(children, (c, i) => ...);
```

### 6. Truyền `false` làm vỡ layout
Mô tả: `{show && <Card/>}` với `show = false` thì children là `false` (bị bỏ qua) — Card không vẽ, khoảng layout mất. Nếu Card luôn cần khung, truyền `null` + fallback hoặc giữ Card và điều kiện bên trong.
```tsx
// ❌ SAI: mong Card vẫn khung khi không có nội dung nhưng nó biến mất
{hasData && <Card>{data}</Card>}
```
```tsx
// ✅ ĐÚNG: Card luôn hiện, nội dung điều kiện bên trong
<Card>{hasData ? data : <small>Chưa có dữ liệu</small>}</Card>
```

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
