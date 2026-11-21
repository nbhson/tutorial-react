# DAY 9: CHILDREN API (CONTENT CHILDREN)

## Mục tiêu bài học
- Hiểu cách React "đọc" và "chỉnh" nội dung projected content qua API `Children` (count/map/forEach/toArray) và `cloneElement` — tương đương `@ContentChild/@ContentChildren` của Angular.
- Biết vì sao đây là kỹ thuật dùng **khiêm tốn**: ưu tiên composition tường minh; chỉ clone khi cần inject prop hàng loạt (Steps, Tabs, Breadcrumb).
- Đối chiếu lifecycle: Angular có `ngAfterContentInit`, React làm traversal **ngay lúc render** — không có lifecycle riêng.

## Khái niệm cốt lõi (Core)

### 1. `children` thô là shape bất định — `Children.*` chuẩn hóa
`children` có thể là 1 element (không `.length`), string, số, fragment, mảng, mảng lồng, `null`, `false`. Gọi `children.length`/`children.map` trực tiếp sẽ crash khi gặp shape không phải mảng. `Children.count/map/forEach/toArray` xử lý đồng nhất mọi shape.

> 📄 **Code ví dụ:** [`examples/01-1-children-tho-la-shape-bat-inh-children.tsx`](examples/01-1-children-tho-la-shape-bat-inh-children.tsx)

`Children.toArray` còn phẳng hóa mảng lồng + gán key ổn định (prefix `.$`) — dùng khi cần `find`/`filter` theo vị trí (Breadcrumb lọc rỗng rồi chèn "/"). Vì sao key tự gán này không làm id nghiệp vụ? Vì nó chỉ để React diff, không phải id dữ liệu — đừng lưu nó vào DB.

> **Tóm gọn 1 câu:** Children thô là hàng nhập đủ mọi kiểu đóng gói — `Children.*` là băng chuyền chuẩn hóa: đếm, duyệt, phẳng hóa đều an toàn.

### 2. `cloneElement(element, newProps)` — bản sao nâng cấp
Tạo element mới giữ props cũ, chồng props mới lên. Cách để cha "inject" (`onClick`, `aria-selected`, `data-*`) vào child mà không sửa nơi khai báo. Giống Angular khi template cha muốn bơm thêm context vào content child.

> 📄 **Code ví dụ:** [`examples/02-2-cloneelement-element-newprops-ban-sao-nang-cap.tsx`](examples/02-2-cloneelement-element-newprops-ban-sao-nang-cap.tsx)

Vì sao phải gộp handler cũ? Vì `cloneElement` **không gộp handler** — prop mới ghi đè prop cũ cùng tên. Ép `onClick` mới mà quên gọi `oldClick` là mất hành vi người dùng đặt ở nơi khai báo (ví dụ analytics). Quy tắc: clone prop nào mà child có thể đã có (`onClick`, `className`, `style`) thì gộp, không ghi đè mù.

> **Tóm gọn 1 câu:** `cloneElement` là photocopy kèm ghi chú đè lên: props cũ còn nhưng handler cùng tên bị đè — gộp tay thì mới giữ được hành vi cũ.

### 3. `isValidElement(x)` — cổng kiểm tra trước khi đọc/clone
String/number không có `.props` — đọc `child.props` trực tiếp sẽ crash. Luôn `if (!isValidElement(child)) return child` trước. Generic `isValidElement<{ value?: string }>` còn cho TS biết shape props mong đợi để `child.props.value` được type-check.

> 📄 **Code ví dụ:** [`examples/03-3-isvalidelement-x-cong-kiem-tra-truoc-khi.tsx`](examples/03-3-isvalidelement-x-cong-kiem-tra-truoc-khi.tsx)

> **Tóm gọn 1 câu:** `isValidElement` là cổng an ninh: hàng thật (element) mới được đọc props/clone — hàng giả (string) được trả nguyên về chỗ cũ.

### 4. Vì sao React không có lifecycle content riêng
Angular có `ngAfterContentInit` (chạy sau khi projected content dựng) để đo/sửa. React render là traversal đơn thuần — lúc `return JSX` bạn đã có toàn bộ cây children để đếm/chỉnh trước khi DOM dựng. Không có pha "sau khi projected" để hẹn giờ; traversal chạy ở body component (trước `return`), kết quả sẵn sàng ngay.

Vì sao vừa gọn vừa khó? Gọn vì không học lifecycle mới; khó vì không có "content changed" stream như `QueryList.changes` — children đổi thì traversal chạy lại trong render kế tiếp, bạn phải tự suy luận từ render chứ không có callback báo.

> **Tóm gọn 1 câu:** React không có pha "sau khi content dựng xong" — bạn cầm sẵn cả cây children ngay lúc render, tính toán luôn ở đó.

### 5. Quy tắc 2026: ưu tiên composition, khiêm tốn với clone
React docs khuyên design API tường minh (compound + context DAY 6) cho đa số trường hợp. `cloneElement` chỉ cho "trang trí hàng loạt" mà composition lẻ tẻ quá rườm rà: Steps đánh số, Breadcrumb chèn separator, Tabs inject aria cho 10 nút. Dấu hiệu lạm dụng: clone sâu nhiều tầng (clone chỉ 1 tầng, muốn sửa con sâu phải tự duyệt — đó là tín hiệu đổi sang compound/render props).

> **Tóm gọn 1 câu:** Ưu tiên composition tường minh; `cloneElement` là con đường mòn chỉ dành cho "trang trí hàng loạt" — clone rải khắp nơi là mùi cần đổi pattern.

### Keyword chính
`Children.count/map/forEach/toArray`, `isValidElement` (cổng), `cloneElement` (bản sao chồng props), `child.type` (lọc theo loại), `@ContentChild/ContentChildren` ↔ Children API, `projected content`, `traversal trong render`.

## Luồng hoạt động (Flow)
Mục này đi qua 9 bước theo đúng trình tự xử lý children trong ví dụ: nhận children hỗn hợp → đếm → bọc → clone → lọc → chèn separator.
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

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

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
Mục này dịch từng khả năng của `@ContentChild/@ContentChildren` sang React — đọc để thấy React "thủ công hóa" projection: mọi thứ duyệt ngay lúc render, không lifecycle, không QueryList.
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

> **Cách đọc bảng này:** mỗi dòng là một khả năng của Angular content query và cách React làm thủ công tương ứng; đọc để nhận ra quy luật — React gỡ hết "phép màu" (selector, lifecycle, stream), đổi lấy sự tường minh.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 8 cái bẫy của Children API — rễ chung: coi `children` là mảng thường, và clone mà quên "người cũ" (handler gốc, key, ref).

### 1. `children.length` thay vì `Children.count`
> 📄 **Code ví dụ:** [`examples/05-1-children-length-thay-vi-children-count.tsx`](examples/05-1-children-length-thay-vi-children-count.tsx)
> 📄 **Code ví dụ:** [`examples/06-1-children-length-thay-vi-children-count.tsx`](examples/06-1-children-length-thay-vi-children-count.tsx)

### 2. Clone không kiểm tra `isValidElement`
> 📄 **Code ví dụ:** [`examples/07-2-clone-khong-kiem-tra-isvalidelement.tsx`](examples/07-2-clone-khong-kiem-tra-isvalidelement.tsx)
> 📄 **Code ví dụ:** [`examples/08-2-clone-khong-kiem-tra-isvalidelement.tsx`](examples/08-2-clone-khong-kiem-tra-isvalidelement.tsx)

### 3. Clone ghi đè handler gốc của người dùng
> 📄 **Code ví dụ:** [`examples/09-3-clone-ghi-e-handler-goc-cua-nguoi.tsx`](examples/09-3-clone-ghi-e-handler-goc-cua-nguoi.tsx)
> 📄 **Code ví dụ:** [`examples/10-3-clone-ghi-e-handler-goc-cua-nguoi.tsx`](examples/10-3-clone-ghi-e-handler-goc-cua-nguoi.tsx)

### 4. Key thay đổi sau clone/toArray
Mô tả: `Children.map` tự key ổn định, nhưng `toArray` + `clone` bừa có thể đổi key → React mất identity → remount (mất focus/state). Fix: giữ key gốc (`key={child.key}` khi clone danh sách động), không tạo key ngẫu nhiên mỗi render.

### 5. Lạm dụng cloneElement cho mọi thứ
Mô tả: API khó hiểu (nhìn nơi dùng không biết prop nào bị inject), perf kém hơn composition (clone tạo element mới mỗi render). Fix: thứ tự (1) children bọc → (2) named props → (3) compound + context → (4) clone chỉ cho Steps/Breadcrumb/datalist "trang trí hàng loạt".

### 6. Quên children có thể là function (render props DAY 6)
> 📄 **Code ví dụ:** [`examples/11-6-quen-children-co-the-la-function-render.tsx`](examples/11-6-quen-children-co-the-la-function-render.tsx)
> 📄 **Code ví dụ:** [`examples/12-6-quen-children-co-the-la-function-render.tsx`](examples/12-6-quen-children-co-the-la-function-render.tsx)

### 7. Dựa vào thứ tự sau khi lọc rỗng mà không chuẩn hóa
> 📄 **Code ví dụ:** [`examples/13-7-dua-vao-thu-tu-sau-khi-loc.tsx`](examples/13-7-dua-vao-thu-tu-sau-khi-loc.tsx)
> 📄 **Code ví dụ:** [`examples/14-7-dua-vao-thu-tu-sau-khi-loc.tsx`](examples/14-7-dua-vao-thu-tu-sau-khi-loc.tsx)

### 8. Clone ghi đè `ref` của child
Mô tả: child có ref nội bộ (focus), clone chồng `ref` mới làm mất ref cũ → focus hỏng. Fix: chỉ chồng props thật cần (`aria-*`, `onClick`, `data-*`), không đụng `ref`/`key` trừ khi chủ đích merge.

## Best practices / Mẹo
- **Thứ tự thiết kế:** (1) composition bọc → (2) named props ReactNode → (3) compound + context → (4) `Children`/`cloneElement` chỉ cho UI kit "trang trí hàng loạt" (Steps/Breadcrumb). Vì sao thứ tự? Vì mỗi bậc sau mờ hơn bậc trước (nhìn nơi dùng không biết bị inject gì).
- Khi clone, tạo helper `withTabProps(child, ctx)` thuần (không side effect) — dễ test, tái dùng. Vì sao thuần? Để unit test gọi helper với child giả, assert props mới mà không render.
- `Children.toArray` khi cần thứ tự ổn định + key (tránh bug trộn types). Vì sao? Vì toArray phẳng + key prefix, map sau không lệch.
- Số thứ tự/đánh dấu (Steps, Stepper, Carousel dots) là "use case vàng" — đúng chỗ dùng, không lạm dụng sang form/business logic.
- Khi cần truyền "context" xuống content child, cân nhắc render props/compound (DAY 6) trước clone — tường minh hơn (nhìn nơi dùng biết dữ liệu từ đâu).
- Với React 19 + Compiler, clone vẫn chạy mỗi render — Compiler giảm phí xung quanh nhưng không bỏ clone. Đừng kỳ vọng Compiler biến clone thành không tốn.

> **Tóm gọn 1 câu:** Thứ tự vàng: bọc → named props → compound → clone cuối cùng — Children API là dao mổ, đừng dùng để cắt bánh.

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
