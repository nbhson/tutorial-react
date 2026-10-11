# DAY 5: CHILDREN (SLOT / NG-CONTENT)

## Mục tiêu bài học
- Hiểu `children` là props đặc biệt của React — mọi thứ nằm giữa thẻ mở/đóng — tương đương `<ng-content>` của Angular.
- Làm chủ "named slots": thay vì `select`, dùng nhiều props kiểu `ReactNode` (header, sidebar, footer...).
- Nắm tư duy **composition > inheritance** — pattern chuẩn 2026 cho UI kit tái sử dụng.

## Khái niệm cốt lõi (Core)
- **`children` chỉ là một prop.** Mọi JSX nằm giữa `<Card>` và `</Card>` được gói vào prop `children` và truyền vào `Card`. Không có magic — chỉ là "JSX là object, gói vào tham số".
- **`React.ReactNode`** là kiểu dành cho children: gồm element, string, number, fragment, array, `null`, boolean (boolean/null bị JSX bỏ qua khi render).
- **Named slots:** Angular dùng `<ng-content select="[slot=header]">`; React **không có select** — bạn tự định nghĩa nhiều props `ReactNode` (`header`, `sidebar`). Lợi ích: type-check từng slot, rõ nơi nào được chèn gì.
- **Composition > inheritance:** đừng thừa kế component (không tồn tại trong React function). Hãy **bọc** (`<Card><SpecialContent /></Card>`) hoặc cấu hình qua props.
- **`children` cho phép cha quyết định nội dung, con quyết định layout** — đảo ngược kiểm soát (inversion of control), nền tảng của layout component.
- **Children là dữ liệu bất biến:** component con chỉ render, không mutate. Muốn biến đổi children (đếm, inject prop) → `Children` API (DAY 9).
- **Render children sớm/lười:** children được tạo *trước* khi component con render; điều này quan trọng cho memoization.
- **Keyword chính:** `children`, `ReactNode`, `slot`, `ng-content`, `composition`, `named slots`, `layout`.

## Luồng hoạt động (Flow)
1. `App` render JSX `<Layout header={<h2>.../>} sidebar={<nav>Menu</nav>}>...<Card>...</Card>...</Layout>`.
2. React đánh giá từng JSX con thành ReactNode: `header` = element `<h2>`, `sidebar` = element `<nav>`, và mọi thứ giữa `<Layout>` `</Layout>` gom vào `children` (bao gồm cả `<Card>` element).
3. `Layout` render: đặt `header` vào `<header>`, `sidebar` vào `<aside>`, `children` vào `<main>`.
4. Trong `<Card>`, `children` = `<p>Nội dung qua children.</p>`; card render nó trong div có border.
5. React dựng DOM; cha kiểm soát nội dung, con kiểm soát khung.
6. Khi state cha đổi và re-render, nếu children là JSX tạo mới mỗi render → element mới; React diff theo vị trí/type.
7. Directive structure của Angular tương đương: `<ng-content>` chiếu nội dung; React chỉ chuyển props.
8. Nếu cần named slots, Layout đọc `header`/`sidebar` props.
9. Re-render không phá vỡ cấu trúc: children "đứng yên" (truyền từ props) được React tái sử dụng.
10. Khi children là hàm (render props), con gọi để lấy JSX (DAY 6).
11. Khi `Layout` re-render vì state riêng đổi, `children` cũ (nếu cha `App` không render lại) được React tái sử dụng — không dựng lại cây con.
12. Nếu `App` re-render, mọi JSX được đánh giá lại → element mới → React diff và chỉ chạm DOM thật sự khác.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 5: children + named slots
import type { ReactNode } from "react";

// Card: layout do Card quyết định, nội dung do cha đưa qua children
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      {children}
    </div>
  );
}

// Layout: 3 "khe" tường minh — header, sidebar, children (main)
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

export default function App() {
  return (
    <Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
      {/* Bất cứ JSX nào đặt ở đây đều thành children của Layout */}
      <Card>
        <p>Nội dung qua children.</p>
      </Card>
    </Layout>
  );
}
```

Slot phụ tùy chọn với fallback nội dung:

```tsx
function Panel({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
      {footer ?? <small>Nội dung mặc định</small>}
    </section>
  );
}
```

## Giải thích từng phần
- `function Card({ children }: { children: ReactNode })`: destructure prop `children`. `Card` không cần biết nội dung cụ thể — chỉ chèn vào vị trí.
- `<div style={{...}}>{children}</div>`: layout của Card là khung viền + padding; nội dung linh hoạt do người dùng Card quyết định.
- `Layout({ header, sidebar, children })`: tương đương 3 `<ng-content select>`. Named props thay vì named slot.
- `<Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>`: JSX con truyền qua attribute (`header`) hoặc nội dung (`children`) — cùng là ReactNode.
- Lồng composition: `Card` nằm trong `children` của `Layout` — composition xếp chồng không giới hạn, không cần kế thừa.
- `ReactNode` bao gồm `children` optional; muốn bắt buộc có con có thể dùng type riêng.
- **Vì sao không dùng `select`?** Props có tên rõ ràng giúp TS kiểm tra và IDE gợi ý từng slot.
- **Truyền children qua attribute hay nội dung?** Nội dung (`children`) tự nhiên cho slot chính; attribute cho slot phụ.
- **Children không re-render khi con re-render**: children tạo ở cha; nếu cha không render lại, element ổn định.
- **Tránh prop-drilling children nhiều tầng** — nếu layout lồng sâu, cân nhắc tách tại nơi dùng.
- **`children = null` mặc định**: component vẫn chạy khi không có con; đôi khi muốn fallback nội dung.
- **Type children hẹp** (`ReactElement`) nếu không muốn cho phép string/number.
- **`ReactNode` vs `ReactElement`:** `ReactNode` rộng (cho phép text, số, mảng, `null`); `ReactElement` chỉ một element đơn — hẹp hơn khi muốn chắc chắn con là 1 element.
- **Kiểm tra "có con hay không":** `Boolean(children)` hoặc `Children.count(children) > 0` để quyết định render wrapper — tránh xuất ra `<div>` rỗng.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `<ng-content>` | `{children}` | Cùng "khe chèn nội dung từ cha" |
| `<ng-content select="[slot=header]">` | prop `{header}` kiểu `ReactNode` | Props riêng thay vì select |
| `<ng-container>` | `<>...</>` fragment | Không thêm DOM wrapper |
| `<ng-template>` + `*ngTemplateOutlet` | render props / component prop (DAY 6) | Render linh hoạt hơn |
| Transclusion tĩnh | `children` + conditional render | React có thể lọc/đếm (DAY 9) |
| Thừa kế component | Composition (bọc) | Function nên composition |
| `@ContentChild` đọc projected | `Children` API (DAY 9) | Traversal lúc render |
| `projectAs` | props `ReactNode` có tên | Không có alias node |
| `ng-content` với fallback | `children ?? <Default/>` | React không có projector fallback sẵn |
| `@HostBinding`/`@HostListener` trên host | props + `children` của component | React không có host element ẩn |

## Lỗi thường gặp (Common pitfalls)
- **Quên khai type `children`** → TS báo lỗi hoặc phải dùng `any`. → Fix: dùng `ReactNode`.
- **Nhầm `children` là prop bắt buộc** → component vẫn chạy khi không có con (children = undefined). → Fix: default `children = null` nếu cần.
- **Đặt children trong attribute** `<Card children={<p/>} />` hoạt động nhưng khó đọc. → Fix: lồng inline.
- **Lạm dụng prop-drilling cho slot sâu** → khó maintain. → Fix: tách Layout tại nơi dùng hoặc Context cho config.
- **Muốn đếm/điều chỉnh children bằng `children` trực tiếp** → string không có props. → Fix: dùng `Children` API (DAY 9).
- **Hiểu lầm children render mỗi lần con render** → element tạo ở cha. → Fix: nắm data flow một chiều.
- **Truyền `false` children làm vỡ layout** → false bị bỏ qua, có thể thiếu khoảng. → Fix: dùng `null` hoặc fallback.
- **Expect React re-render children khi con re-render** → không; cha mới là nơi tạo. → Fix: đặt state ở đúng tầng.
- **Named slot trùng tên** → khó đọc. → Fix: quy ước `header`/`footer`/`aside`.
- **Render `<div>` bọc ngoài dù không có children** → DOM rỗng gây lệch layout. → Fix: kiểm tra children rồi mới render wrapper.
- **Giả định `children` có `.map`/`.length`** → children có thể là string/number đơn. → Fix: coi children là `ReactNode` mờ; cần duyệt thì dùng `Children` API (DAY 9).

## Best practices / Mẹo
- **Thiết kế component theo slots trước**, sau đó tới state/logic — Card tốt là "khung" với children.
- Dùng **compound components + context** (DAY 6) khi nhiều slot chia sẻ state (Tabs, Accordion).
- Nếu layout ăn nhiều `ReactNode` props, gộp config hoặc tách nhỏ — tránh "props quá khổ".
- Type `children: ReactNode` để IDE báo lỗi khi truyền object lạ.
- Đặt default cho slot phụ để component dùng được mà không cần truyền đủ.
- Với slot tùy chọn, `children?: ReactNode` + render có điều kiện.
- Giữ tên slot nhất quán giữa các component (header/body/footer).
- **Đặt `children` ở cuối interface props** cho dễ đọc và khớp thói quen viết JSX.
- Nếu component có nhiều slot, dùng `children` cho slot lớn nhất, props `ReactNode` cho các slot còn lại.

## Bài tập nhỏ
1. Thêm 2 slot mới vào `Layout` (`footer`, `toolbar`) và truyền nội dung tương ứng — kiểm thứ tự render.
2. Tạo `Dialog` nhận `title`, `actions` (ReactNode), `children`; dùng 2 chỗ với nội dung khác nhau.
3. Viết `Tabs` (tĩnh) nhận slot `tabList` + `children` cho panel.
4. Tạo `Page` nhận `title` + `children` + `aside?` với default null.
5. So sánh khoảng trắng DOM khi dùng `<div>` so với fragment cho slot.
6. Truyền `children` là chuỗi (`<Card>Xin chào</Card>`) và là mảng (`<Card>{["a", "b"]}</Card>`) — quan sát `ReactNode` chấp nhận cả hai và cách render.

## Reference
- https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
- https://react.dev/reference/react/Children
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/react/typescript