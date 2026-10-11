# DAY 9: CHILDREN API (CONTENT CHILDREN)

## Mục tiêu bài học
- Hiểu cách React "đọc" và "chỉnh" nội dung projected content qua API `Children` (count/map/forEach/toArray) và `cloneElement` — tương đương `@ContentChild/@ContentChildren` của Angular.
- Biết vì sao đây là kỹ thuật dùng **khiêm tốn**: ưu tiên composition tường minh; chỉ clone khi cần inject prop hàng loạt (Steps, Tabs, Breadcrumb).
- Đối chiếu lifecycle: Angular có `ngAfterContentInit`, React làm traversal **ngay lúc render** — không có lifecycle riêng.

## Khái niệm cốt lõi (Core)
- **`children` thô là mảng/lồng nhau, không phải danh sách gọn.** Có thể là element, string, fragment, mảng, `null`. `Children.*` giúp xử lý đồng nhất: `Children.count`, `Children.map`, `Children.forEach`, `Children.toArray` (chunk mọi shape thành mảng + gán key).
- **`cloneElement(element, newProps)`:** tạo bản sao element với props chồng lên — cách để component cha "inject" prop (onClick, aria-selected, data-*) vào child mà không phải sửa nơi khai báo. Giống Angular khi template cha muốn truyền thêm context vào content child.
- **`isValidElement(x)`:** kiểm tra trước khi clone — tránh gọi props trên string/number (string không có props).
- **Vì sao React không có lifecycle content riêng:** render là traversal đơn thuần — lúc `return JSX` bạn đã có toàn bộ cây children để đếm/chỉnh trước khi DOM được sử dụng. Điều này vừa gọn vừa phức tạp: không có "sau khi projected" để hẹn giờ.
- **Quy tắc 2026:** React docs khuyên design API tường minh (compound + context — DAY 6) cho đa số trường hợp; `cloneElement` giới hạn khi thao tác "trang trí hàng loạt" mà composition lẻ tẻ quá rườm rà.
- **Keyword chính:** `Children.count/map/toArray`, `isValidElement`, `cloneElement`, `props` quy nạp, `@ContentChild`, `projected content`, `traversal`.

## Luồng hoạt động (Flow)
1. `<Steps>` nhận `children` — 3 `<span>`.
2. Render `Steps`: `Children.count(children)` → tổng = 3.
3. `Children.map(children, (child, i) => ...)` lặp từng child (xử lý mảng lồng/fragment một cách đồng nhất), với index `i`.
4. Với mỗi child, bọc vào `<li data-step={i+1} data-total={count}>{child}</li>` — kết quả là mảng `<li>`.
5. Phiên bản `cloneElement` trong README gốc: mỗi child hợp lệ được clone với `aria-selected` + `onClick` mới; child không phải element (string) giữ nguyên.
6. DOM render: `<ol>` chứa các `<li>` với số bước và nội dung gốc; với clone: tab button có a11y đầy đủ.
7. Bất cứ khi nào state cha đổi, traversal chạy lại trong render — không cần hook "content changed".
8. `Children.toArray(children)` chuẩn hóa mọi shape thành mảng phẳng và gán key ổn định — hữu ích khi cần `find`/`filter` theo vị trí.
9. `cloneElement` giữ props cũ của child, chỉ chồng props mới — nhưng **không** gộp handler cũ; nếu cần, tự gọi handler cũ trong handler mới.
10. Traversal luôn chạy ở body component (trước `return`), nên kết quả sẵn sàng ngay khi JSX được dựng — không có pha "sau khi content init" như Angular.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 9: duyệt + đánh số children
import { Children } from "react";

function Steps({ children }: { children: React.ReactNode }) {
  // Đếm: cho số tổng bước (xử lý đúng cả khi children là mảng/fragment)
  const total = Children.count(children);
  return (
    <ol>
      {/* Map: thêm index + tổng số vào mỗi bước; child gốc giữ nguyên */}
      {Children.map(children, (child, i) => (
        <li>
          Bước {i + 1}/{total}: {child}
        </li>
      ))}
    </ol>
  );
}

export default function App() {
  return (
    <Steps>
      <span>Đăng nhập</span>
      <span>Chọn hàng</span>
      <span>Thanh toán</span>
    </Steps>
  );
}
```

```tsx
// cloneElement — inject prop vào Tabs (trích từ README DAY 9 cũ, cập nhật TS)
import { Children, cloneElement, isValidElement } from "react";

function TabsList({ children, active, onSelect }: {
  children: React.ReactNode; active: string; onSelect: (v: string) => void;
}) {
  return (
    <div role="tablist">
      {Children.map(children, (child) => {
        if (!isValidElement<{ value?: string }>(child)) return child; // string/number: bỏ qua
        const value = child.props.value ?? "";
        return cloneElement(child, {
          "aria-selected": value === active,
          onClick: () => onSelect(value),
        } as Partial<unknown> as Record<string, unknown>);
      })}
    </div>
  );
}
```

Breadcrumb — chèn dấu phân cách giữa các child:

```tsx
import { Children, type ReactNode } from "react";

function Breadcrumb({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="breadcrumb">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
```

## Giải thích từng phần
- `Children.count(children)`: chính xác hơn `children.length` — children có thể là một element đơn (không có `.length`), string, hoặc mảng lồng; `count` chuẩn hóa tất cả.
- `Children.map(children, (child, i) => ...)`: giống `items.map` nhưng an toàn với mọi shape; nếu cần thứ tự + key ổn định khi children đổi, dùng `Children.toArray` trước.
- `<li>Bước {i+1}/{total}: {child}</li>`: bọc — không sửa child, chỉ thêm context bao quanh. Đơn giản, không rủi ro props.
- `isValidElement<{ value?: string }>(child)`: generic nhận kiểu props mong đợi; return nguyên child không hợp lệ.
- `cloneElement(child, {...})`: "bản sao nâng cấp" — props cũ giữ, props mới chồng lên; chú ý TS cần cast vì props truyền động.
- **Cạm bẫy logic:** nếu `value === active` là `false`, `"aria-selected"` = `false` (boolean) — React render bỏ qua thuộc tính khi `false`, nhưng với ARIA attribute nên truyền chuỗi `"true"/"false"` để chắc chắn.
- **`Children.toArray` gán key tự động:** nó thêm prefix `.$` để tránh trùng khi children trộn — đừng lấy key này làm id nghiệp vụ.
- **`child.type` để lọc:** có thể so `child.type === Step` hoặc `typeof child.type === "string"` để phân biệt host element vs component.
- **`cloneElement` không recursive:** nó chỉ sao chép một tầng; muốn sửa con sâu phải tự duyệt (thường là dấu hiệu nên đổi thiết kế API).
- **A11y với clone:** inject `role`/`aria-*` nên truyền chuỗi `"true"/"false"`, không phải boolean, để screen reader đọc đúng.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@ContentChild(StepComp)` | `Children.toArray(children).find(isValidElement...)` | Chọn child theo vị trí/kiểu, không có selector |
| `@ContentChildren(StepComp)` | `Children.map/count` | Duyệt toàn bộ projected children |
| `ngAfterContentInit` | traversal ngay trong render | React không có lifecycle content riêng |
| Query theo directive/templateRef | kiểm tra `isValidElement` + `child.type` | So khớp bằng type/props thủ công |
| Projection + `ngTemplateOutlet` | render props (DAY 6) | Thích hợp hơn clone sâu |
| Sửa projected content (rare) | `cloneElement` | Cả hai đều "xâm nhập" — cẩn thận cập nhật lại |
| `@ContentChildren` + `QueryList.changes` | `Children.map` mỗi render | Không có "changes" stream |
| `ContentChild` theo `#ref` | so khớp `child.props`/`child.type` | Không có template ref name |
| `ng-template` + context | `cloneElement(child, extraProps)` | Bơm dữ liệu vào content |

## Lỗi thường gặp (Common pitfalls)
- **`children.length` thay vì `Children.count`** → crash khi có 1 child (không phải mảng). → Fix: luôn `Children.count`.
- **Clone không kiểm tra `isValidElement`** → string child `"Hello"` không có `.props` → crash. → Fix: kiểm tra trước khi đọc props/clone.
- **Clone ghi đè prop mà child cũng cần** (vd ép `onClick` chồng lên `onClick` của người dùng) → bỏ mất handler gốc. → Fix: kết hợp handler cũ: `onClick: () => { child.props.onClick?.(); onSelect(value); }`.
- **Key thay đổi sau clone** → React mất identity -> remount; `Children.map` tự tạo key ổn định nhưng sau `toArray`/`clone` cẩn thận giữ key gốc.
- **Lạm dụng cloneElement cho mọi thứ** → API khó hiểu, performance kém hơn composition tường minh; React docs khuyên thay bằng compound components + context (DAY 6).
- **Quên rằng children có thể là function** (render props, DAY 6) — `Children.map` sẽ trả về function, không render được. → Fix: tách trường hợp hoặc ép kiểu child dùng được.
- **Dựa vào thứ tự children sau khi lọc rỗng** → cần chuẩn hóa trước. → Fix: `Children.toArray(...).filter(Boolean)` rồi mới map.
- **Clone rồi ghi đè `ref` của child** → moment ref nội bộ có thể bị thay; cẩn thận khi merge props. → Fix: chỉ chồng props thật cần thiết.
- **Kỳ vọng clone "rẻ" hơn composition** → clone tạo element mới mỗi render; list lớn hãy đo perf. → Fix: ưu tiên composition tường minh khi có thể.

## Best practices / Mẹo
- **Ưu tiên thứ tự thiết kế:** (1) composition qua children — (2) named props ReactNode — (3) compound + context — (4) `Children`/`cloneElement` cho UI kit cần "trang trí" hàng loạt như Steps/Breadcrumb/datalist.
- Khi clone, **tạo helper** `withTabProps(child, ctx)` trả về element mới — dễ test và tái dùng.
- Dùng `Children.toArray` khi cần map và giữ thứ tự ổn định với key: tránh bug khi children trộn types.
- Số thứ tự/đánh dấu (Steps, Stepper, Carousel dots) là "use case vàng" của Children API — đúng chỗ dùng, không lạm dụng.
- **Dùng `Children` API cho UI kit tái sử dụng** (Breadcrumb, Stepper, datalist) thay vì rải logic ở từng nơi dùng.
- Khi cần truyền "context" xuống content child, cân nhắc render props/compound (DAY 6) trước khi tới clone — tường minh hơn.
- Giữ helper clone thuần (không side effect) để dễ test và suy luận.
- Với React 19 + Compiler, clone vẫn chạy mỗi render — nhưng Compiler giảm chi phí các phần không đổi xung quanh.

## Bài tập nhỏ
1. Nâng cấp `Steps` (từ example.tsx) thành `Stepper` với 3 trạng thái: `done`(✓), `active`(●), `pending` — nhận thêm prop `activeIndex`, tự đánh dấu từng bước bằng index.
2. Viết `DataList` render props-inject: `cloneElement` thêm `onClick` + `aria-current` vào mỗi `<li>` hợp lệ; thêm nút "select cả 3" xem handler chồng handler hoạt động (goi handler cũ rồi handler mới).
3. Viết `Breadcrumb` nhận children là các `<a>`, tự chèn dấu `/` giữa các phần bằng `Children.toArray` + index.
4. Viết `Stepper` dùng `cloneElement` inject `aria-current` cho bước đang active (theo `activeIndex`).
5. Truyền một string lẫn một element vào `Steps` và kiểm tra `isValidElement` xử lý đúng từng loại.

## Reference
- https://react.dev/reference/react/Children
- https://react.dev/reference/react/cloneElement
- https://react.dev/reference/react/isValidElement