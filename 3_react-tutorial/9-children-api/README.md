# DAY 9: CHILDREN API (CONTENT CHILDREN)

## Mục tiêu bài học
- Hiểu cách React "đọc" và "chỉnh" nội dung projected content qua API `Children` (count/map/forEach/toArray) và `cloneElement` — tương đương `@ContentChild/@ContentChildren` của Angular.
- Biết vì sao đây là kỹ thuật dùng **khiêm tốn**: ưu tiên composition tường minh; chỉ clone khi cần inject prop hàng loạt (Steps, Tabs, Breadcrumb).
- Đối chiếu lifecycle: Angular có `ngAfterContentInit`, React làm traversal **ngay lúc render** — không có lifecycle riêng.

## Khái niệm cốt lõi (Core)

### 1. `children` thô là shape bất định — `Children.*` chuẩn hóa
`children` có thể là 1 element (không `.length`), string, số, fragment, mảng, mảng lồng, `null`, `false`. Gọi `children.length`/`children.map` trực tiếp sẽ crash khi gặp shape không phải mảng. `Children.count/map/forEach/toArray` xử lý đồng nhất mọi shape.

```tsx
// example.tsx Steps: đếm đúng cả 3 <span> + 1 string
const total = Children.count(children); // 4 — đúng dù có string lẫn element
// children.length ở đây sẽ crash hoặc sai vì children không phải mảng phẳng

// Map an toàn: callback nhận (child, index đã chuẩn hóa)
{Children.map(children, (child, i) => (
  <li>Bước {i + 1}/{total}: {child}</li>
))}
```

`Children.toArray` còn phẳng hóa mảng lồng + gán key ổn định (prefix `.$`) — dùng khi cần `find`/`filter` theo vị trí (Breadcrumb lọc rỗng rồi chèn "/"). Vì sao key tự gán này không làm id nghiệp vụ? Vì nó chỉ để React diff, không phải id dữ liệu — đừng lưu nó vào DB.

### 2. `cloneElement(element, newProps)` — bản sao nâng cấp
Tạo element mới giữ props cũ, chồng props mới lên. Cách để cha "inject" (`onClick`, `aria-selected`, `data-*`) vào child mà không sửa nơi khai báo. Giống Angular khi template cha muốn bơm thêm context vào content child.

```tsx
// TabsList trong example.tsx: inject aria + onClick vào mỗi Tab hợp lệ
if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child; // string: giữ nguyên
const value = child.props.value ?? "";
const oldClick = child.props.onClick; // giữ handler gốc của người dùng
return cloneElement(child, {
  "aria-selected": value === active ? "true" : "false", // chồng prop mới
  onClick: () => { oldClick?.(); onSelect(value); }, // GỘP handler cũ + mới
});
```

Vì sao phải gộp handler cũ? Vì `cloneElement` **không gộp handler** — prop mới ghi đè prop cũ cùng tên. Ép `onClick` mới mà quên gọi `oldClick` là mất hành vi người dùng đặt ở nơi khai báo (ví dụ analytics). Quy tắc: clone prop nào mà child có thể đã có (`onClick`, `className`, `style`) thì gộp, không ghi đè mù.

### 3. `isValidElement(x)` — cổng kiểm tra trước khi đọc/clone
String/number không có `.props` — đọc `child.props` trực tiếp sẽ crash. Luôn `if (!isValidElement(child)) return child` trước. Generic `isValidElement<{ value?: string }>` còn cho TS biết shape props mong đợi để `child.props.value` được type-check.

```tsx
// example.tsx Steps có string child "Ghi chú chuỗi":
// - Steps (bọc): không cần isValidElement vì chỉ bọc ngoài, không đọc .props — string bọc được
// - TabsList (clone): BẮT BUỘC isValidElement vì đọc child.props.value — string bỏ qua
```

### 4. Vì sao React không có lifecycle content riêng
Angular có `ngAfterContentInit` (chạy sau khi projected content dựng) để đo/sửa. React render là traversal đơn thuần — lúc `return JSX` bạn đã có toàn bộ cây children để đếm/chỉnh trước khi DOM dựng. Không có pha "sau khi projected" để hẹn giờ; traversal chạy ở body component (trước `return`), kết quả sẵn sàng ngay.

Vì sao vừa gọn vừa khó? Gọn vì không học lifecycle mới; khó vì không có "content changed" stream như `QueryList.changes` — children đổi thì traversal chạy lại trong render kế tiếp, bạn phải tự suy luận từ render chứ không có callback báo.

### 5. Quy tắc 2026: ưu tiên composition, khiêm tốn với clone
React docs khuyên design API tường minh (compound + context DAY 6) cho đa số trường hợp. `cloneElement` chỉ cho "trang trí hàng loạt" mà composition lẻ tẻ quá rườm rà: Steps đánh số, Breadcrumb chèn separator, Tabs inject aria cho 10 nút. Dấu hiệu lạm dụng: clone sâu nhiều tầng (clone chỉ 1 tầng, muốn sửa con sâu phải tự duyệt — đó là tín hiệu đổi sang compound/render props).

### Keyword chính
`Children.count/map/forEach/toArray`, `isValidElement` (cổng), `cloneElement` (bản sao chồng props), `child.type` (lọc theo loại), `@ContentChild/ContentChildren` ↔ Children API, `projected content`, `traversal trong render`.

## Luồng hoạt động (Flow)
1. `<Steps>` nhận `children` — 3 `<span>` + 1 string "Ghi chú chuỗi" (4 node logic, shape hỗn hợp).
2. Render `Steps`: `Children.count(children)` → 4 (đúng dù có string; `children.length` sẽ sai).
3. `Children.map(children, (child, i) => ...)` lặp từng child đã chuẩn hóa, `i` là index 0..3. Bọc mỗi child vào `<li>Bước {i+1}/{total}: {child}</li>` — child gốc giữ nguyên, không sửa.
4. `<TabsList active="b">` nhận 2 `<button value>`. `Children.map` duyệt từng child; `isValidElement` loại string (ở đây không có, nhưng guard vẫn cần); đọc `child.props.value`; `cloneElement` chồng `aria-selected` + `onClick` gộp.
5. DOM render: `<ol>` 4 `<li>` đánh số; tab B có `aria-selected="true"`, tab A `"false"`. Click tab → `oldClick?.()` (nếu có) rồi `onSelect(value)` → alert.
6. `<Breadcrumb>` nhận 2 `<a>` + 1 `<span>`: `Children.toArray` phẳng hóa + gán key, `.filter(Boolean)` bỏ null/false, `.map` chèn `" / "` giữa (trừ phần cuối) với `key={i}` cho separator wrapper.
7. Bất cứ khi nào state cha đổi, traversal chạy lại trong render — không cần hook "content changed". Không có `QueryList.changes` để subscribe.
8. `cloneElement` giữ props cũ, chỉ chồng mới — nhưng **không gộp handler**; example gộp tay `oldClick?.()` + `onSelect`. Không gộp là mất handler gốc.
9. Traversal luôn ở body (trước `return`) nên sẵn sàng khi JSX dựng — không pha "sau content init" như Angular. Muốn đo DOM sau khi content vẽ xong thì vẫn cần effect (DAY 15), không phải Children API.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục (Steps + TabsList clone + Breadcrumb):

```tsx
// example.tsx — DAY 9: duyệt + đánh số + clone inject + breadcrumb (khớp README)
// Mục đích: đọc/chỉnh projected content — đếm, bọc, inject prop, chèn separator.
import { Children, cloneElement, isValidElement } from "react"; // (1) Bộ API duyệt children an toàn mọi shape
import type { ReactNode } from "react";

// (2) Steps: đếm + bọc — KHÔNG sửa child gốc, chỉ thêm context bao quanh (pattern an toàn nhất).
function Steps({ children }: { children: ReactNode }) {
  // Children.count đúng cả khi 1 child (không .length), fragment, mảng lồng
  const total = Children.count(children);
  return (
    <ol>
      {/* Children.map an toàn mọi shape; i là index sau chuẩn hóa */}
      {Children.map(children, (child, i) => (
        <li>
          Bước {i + 1}/{total}: {child}
        </li>
      ))}
    </ol>
  );
}

// (3) TabsList: cloneElement inject prop (aria-selected + onClick) vào child hợp lệ.
// Dùng khi cần "trang trí hàng loạt" mà composition lẻ tẻ quá rườm rà.
function TabsList({ children, active, onSelect }: {
  children: ReactNode; active: string; onSelect: (v: string) => void;
}) {
  return (
    <div role="tablist">
      {Children.map(children, (child) => {
        // String/number không có .props — kiểm tra trước khi đọc/clone
        if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child;
        const value = child.props.value ?? ""; // đọc prop gốc của child
        // clone giữ props cũ, chồng props mới; gộp handler cũ để không mất onClick người dùng
        const oldClick = child.props.onClick;
        return cloneElement(child, {
          "aria-selected": value === active ? "true" : "false", // chuỗi cho ARIA, không boolean
          onClick: () => { oldClick?.(); onSelect(value); },
        });
      })}
    </div>
  );
}

// (4) Breadcrumb: toArray chuẩn hóa + filter rỗng + chèn "/" giữa các phần.
function Breadcrumb({ children }: { children: ReactNode }) {
  // toArray phẳng hóa + gán key ổn định; filter(Boolean) bỏ null/false/undefined
  const parts = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="breadcrumb">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && " / "} {/* separator trừ phần cuối */}
        </span>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <>
      {/* (5) Steps với 3 element + 1 string để chứng minh isValidElement/count xử lý mọi loại */}
      <Steps>
        <span>Đăng nhập</span>
        <span>Chọn hàng</span>
        <span>Thanh toán</span>
        {"Ghi chú chuỗi"} {/* string child — Steps bọc được, TabsList bỏ qua khi clone */}
      </Steps>
      {/* (6) TabsList inject — Tab là button có value, active="b" */}
      <TabsList active="b" onSelect={(v) => alert(`Chọn ${v}`)}>
        <button value="a">Tab A</button>
        <button value="b">Tab B</button>
      </TabsList>
      {/* (7) Breadcrumb chèn separator */}
      <Breadcrumb>
        <a href="/">Home</a>
        <a href="/shop">Shop</a>
        <span>Checkout</span>
      </Breadcrumb>
    </>
  );
}
```

## Giải thích từng phần
- Dòng `import { Children, cloneElement, isValidElement }`: ba API cho ba việc — `Children` duyệt an toàn, `isValidElement` cổng kiểm tra, `cloneElement` sao chép chồng props. Thiếu một là phải tự xử shape/mutate — sai.
- Dòng `Children.count(children)`: chính xác hơn `children.length` vì children có thể là 1 element (không `.length`), string, mảng lồng, fragment. `count` chuẩn hóa tất cả về số node logic. Dùng để hiện "Bước X/Tổng".
- Dòng `Children.map(children, (child, i) => <li>...)`: như `Array.map` nhưng an toàn mọi shape; `i` là index sau chuẩn hóa (phẳng). Nếu cần key ổn định khi children đổi thứ tự, `Children.toArray` trước rồi map (toArray gán key prefix `.$`).
- Dòng `<li>Bước {i+1}/{total}: {child}</li>`: **bọc** thay vì sửa — không đụng props child gốc, chỉ thêm context (số thứ tự/tổng) bao quanh. Đây là pattern an toàn nhất, không rủi ro ghi đè props như clone.
- Dòng `isValidElement<{ value?: string; onClick?: () => void }>(child)`: generic khai shape props mong đợi để `child.props.value` type-check. Trả nguyên child không hợp lệ (string) — không crash, không bỏ mất nội dung.
- Dòng `const value = child.props.value ?? ""`: đọc prop gốc. `?? ""` vì `value` có thể `undefined` (button không value) — fallback chuỗi rỗng để `onSelect("")` không crash.
- Dòng `cloneElement(child, { "aria-selected": ..., onClick: ... })`: "bản sao nâng cấp" — props cũ giữ, props mới chồng. TS cần object đúng shape; vì props động nên đôi khi cần cast — ở đây type đã rõ nên không cast.
- Cạm bẫy ARIA: `value === active` là boolean, nhưng `"aria-selected"` nên là chuỗi `"true"/"false"` (như example) thay vì boolean. Vì sao? Vì React bỏ qua thuộc tính khi `false` boolean, còn ARIA cần hiện `"false"` rõ để screen reader biết "không chọn" (khác "không có thông tin").
- Dòng `const oldClick = child.props.onClick; onClick: () => { oldClick?.(); onSelect(value); }`: **gộp handler** — gọi handler người dùng trước rồi handler inject. Không gộp là mất analytics/validate ở nơi khai báo. `?.()` vì có thể không có handler gốc.
- Dòng `Children.toArray(children).filter(Boolean)`: `toArray` phẳng + gán key; `filter(Boolean)` bỏ `null`/`false`/`undefined`/`""` trước khi chèn separator — nếu không, separator đếm cả node rỗng, `" / "` thừa.
- Dòng `{parts.map((part, i) => <span key={i}>...)}`: `key={i}` ở đây là key cho wrapper separator (vị trí ổn định trong breadcrumb tĩnh). Với list động thêm/xóa giữa, key index vẫn xấu (DAY 2) — breadcrumb thường tĩnh nên chấp nhận được.
- Dòng `child.type` (không trong ví dụ nhưng cần biết): so `child.type === Step` để lọc theo component, hoặc `typeof child.type === "string"` để phân biệt host element (`"div"`) vs component (function). Dùng khi muốn chỉ đánh số `Step` mà bỏ qua `<hr/>` xen giữa.
- Quy tắc **`cloneElement` không recursive**: chỉ sao chép 1 tầng. Muốn sửa con sâu (cháu) phải tự duyệt đệ quy — đó là tín hiệu thiết kế sai, nên đổi sang compound/context (DAY 6) cho tường minh.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@ContentChild(StepComp)` lấy 1 child | `Children.toArray(children).find(c => isValidElement(c) && c.type === Step)` | Chọn theo vị trí/kiểu thủ công, không selector |
| `@ContentChildren(StepComp)` lấy nhiều | `Children.map/count/forEach` duyệt toàn bộ | Không QueryList, duyệt mỗi render |
| `ngAfterContentInit` (sau khi projected dựng) | traversal ngay trong render (trước `return`) | React không lifecycle content riêng |
| Query theo directive/templateRef (`#ref`) | kiểm tra `isValidElement` + `child.type`/`child.props` | So khớp thủ công, không template ref name |
| Projection + `ngTemplateOutlet` linh hoạt | render props (DAY 6) | Thích hợp hơn clone sâu |
| Sửa projected content (hiếm) | `cloneElement(child, extraProps)` | Cả hai đều "xâm nhập" — gộp handler cũ |
| `@ContentChildren` + `QueryList.changes` stream | `Children.map` mỗi render (không stream) | Không có "changes" để subscribe |
| `ng-template` + context bơm dữ liệu | `cloneElement(child, extraProps)` hoặc render props | Bơm dữ liệu vào content |
| Lọc content theo loại | `child.type === X` | So type trực tiếp |

## Lỗi thường gặp (Common pitfalls)

### 1. `children.length` thay vì `Children.count`
```tsx
// ❌ SAI: 1 child (không phải mảng) -> crash Cannot read properties of undefined
const n = (children as any[]).length;
```
```tsx
// ✅ ĐÚNG: đúng mọi shape
import { Children } from "react";
const n = Children.count(children);
```

### 2. Clone không kiểm tra `isValidElement`
```tsx
// ❌ SAI: string "Hello" không có .props -> crash
Children.map(children, (c) => cloneElement(c as any, { onClick: fn }));
```
```tsx
// ✅ ĐÚNG: cổng kiểm tra, string giữ nguyên
Children.map(children, (c) => {
  if (!isValidElement(c)) return c;
  return cloneElement(c, { onClick: fn });
});
```

### 3. Clone ghi đè handler gốc của người dùng
```tsx
// ❌ SAI: mất onClick gốc (ví dụ analytics ở nơi khai báo)
cloneElement(child, { onClick: () => onSelect(value) });
```
```tsx
// ✅ ĐÚNG: gộp — gọi cũ rồi mới (như TabsList trong ví dụ)
const old = (child as any).props.onClick;
cloneElement(child, { onClick: () => { old?.(); onSelect(value); } });
```

### 4. Key thay đổi sau clone/toArray
Mô tả: `Children.map` tự key ổn định, nhưng `toArray` + `clone` bừa có thể đổi key → React mất identity → remount (mất focus/state). Fix: giữ key gốc (`key={child.key}` khi clone danh sách động), không tạo key ngẫu nhiên mỗi render.

### 5. Lạm dụng cloneElement cho mọi thứ
Mô tả: API khó hiểu (nhìn nơi dùng không biết prop nào bị inject), perf kém hơn composition (clone tạo element mới mỗi render). Fix: thứ tự (1) children bọc → (2) named props → (3) compound + context → (4) clone chỉ cho Steps/Breadcrumb/datalist "trang trí hàng loạt".

### 6. Quên children có thể là function (render props DAY 6)
```tsx
// ❌ SAI: Children.map trả function, render function -> trắng
<Steps>{({ x }) => <p>{x}</p>}</Steps>
```
```tsx
// ✅ ĐÚNG: tách trường hợp — typeof children === "function" thì gọi, không thì map
typeof children === "function" ? (children as any)(data) : Children.map(children, ...)
```

### 7. Dựa vào thứ tự sau khi lọc rỗng mà không chuẩn hóa
```tsx
// ❌ SAI: map trực tiếp rồi filter index — node null/false lệch số thứ tự
Children.map(children, (c, i) => <li>{i}: {c}</li>)
```
```tsx
// ✅ ĐÚNG: toArray + filter(Boolean) trước rồi map (như Breadcrumb)
const parts = Children.toArray(children).filter(Boolean);
parts.map((p, i) => ...)
```

### 8. Clone ghi đè `ref` của child
Mô tả: child có ref nội bộ (focus), clone chồng `ref` mới làm mất ref cũ → focus hỏng. Fix: chỉ chồng props thật cần (`aria-*`, `onClick`, `data-*`), không đụng `ref`/`key` trừ khi chủ đích merge.

## Best practices / Mẹo
- **Thứ tự thiết kế:** (1) composition bọc → (2) named props ReactNode → (3) compound + context → (4) `Children`/`cloneElement` chỉ cho UI kit "trang trí hàng loạt" (Steps/Breadcrumb). Vì sao thứ tự? Vì mỗi bậc sau mờ hơn bậc trước (nhìn nơi dùng không biết bị inject gì).
- Khi clone, tạo helper `withTabProps(child, ctx)` thuần (không side effect) — dễ test, tái dùng. Vì sao thuần? Để unit test gọi helper với child giả, assert props mới mà không render.
- `Children.toArray` khi cần thứ tự ổn định + key (tránh bug trộn types). Vì sao? Vì toArray phẳng + key prefix, map sau không lệch.
- Số thứ tự/đánh dấu (Steps, Stepper, Carousel dots) là "use case vàng" — đúng chỗ dùng, không lạm dụng sang form/business logic.
- Khi cần truyền "context" xuống content child, cân nhắc render props/compound (DAY 6) trước clone — tường minh hơn (nhìn nơi dùng biết dữ liệu từ đâu).
- Với React 19 + Compiler, clone vẫn chạy mỗi render — Compiler giảm phí xung quanh nhưng không bỏ clone. Đừng kỳ vọng Compiler biến clone thành không tốn.

## Bài tập nhỏ
1. Nâng `Steps` thành `Stepper` 3 trạng thái (`done` ✓, `active` ●, `pending`) nhận thêm `activeIndex`, tự đánh dấu từng bước bằng index. Dùng bọc (không clone) — vì sao bọc đủ?
2. Viết `DataList` clone inject `onClick` + `aria-current` vào mỗi `<li>` hợp lệ; thêm nút "select cả 3" kiểm tra gộp handler (handler cũ + mới đều chạy).
3. Viết `Breadcrumb` nhận children `<a>`, tự chèn `/` bằng `toArray` + index (như ví dụ) — thêm prop `separator` tùy biến (`/` vs `>`).
4. Viết `Stepper` dùng `cloneElement` inject `aria-current` cho bước active theo `activeIndex` — so sánh với bản bọc ở bài 1, khi nào clone gọn hơn?
5. Truyền 1 string + 1 element vào `Steps` và kiểm tra `isValidElement` xử lý đúng từng loại (string bọc được, clone bỏ qua).

## Reference
- https://react.dev/reference/react/Children
- https://react.dev/reference/react/cloneElement
- https://react.dev/reference/react/isValidElement
