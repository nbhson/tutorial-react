# DAY 9 — Hỏi & Đáp: Children API

> File hỏi–đáp chi tiết cho `3_react-tutorial/9-children-api`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (Steps đánh số chạy được).

---

## 1. Vì sao cần `Children` API trong khi đã có `children` (DAY 5)?

**Hỏi:** `children` render trực tiếp được rồi, cần gì `Children.count/map`?

**Đáp:**
- `children` **thô** có thể là element, string, fragment, mảng lồng, `null` — hình dạng bất định,
  không `.map` trực tiếp an toàn được.
- `Children.*` chuẩn hóa mọi hình về một cách duyệt đồng nhất: `count` đếm đúng cả fragment/mảng,
  `map`/`forEach` lặp từng child kèm index, `toArray` phẳng hóa + gán key để `find`/`filter` theo vị trí.
- Trong example, `Steps` đếm tổng bước (`Children.count`) và đánh số từng bước (`Children.map`
  bọc `<li>Bước {i+1}/{total}</li>`) mà không cần biết cha truyền 3 `<span>` hay fragment.

---

## 2. `cloneElement` là gì? Khi nào dùng thay vì bọc `<li>`?

**Hỏi:** Example chỉ bọc `<li>` quanh child — vậy `cloneElement` để làm gì?

**Đáp:**
- Bọc (`<li>{child}</li>`) giữ child nguyên vẹn. `cloneElement(child, newProps)` **sao chép element
  và chồng props mới** — để cha "inject" prop vào child mà không sửa nơi khai báo
  (`aria-selected`, `onClick`, `data-*` cho Steps/Tabs/Breadcrumb).
- Giống Angular khi template cha muốn truyền thêm context vào content child — nhưng làm **ngay lúc render**,
  không có lifecycle riêng như `ngAfterContentInit`.
- Lưu ý: clone **giữ props cũ, không gộp handler cũ** — cần thì tự gọi handler cũ trong handler mới.

---

## 3. `isValidElement` để làm gì?

**Hỏi:** Cứ `cloneElement` mọi child luôn được không?

**Đáp:**
- Không — child có thể là **string/number** (không có props). `isValidElement(child)` kiểm tra trước:
  element thì clone/inject, string thì giữ nguyên. Bỏ qua là crash khi clone nhầm text node.

---

## 4. Vì sao React không có lifecycle content riêng như Angular?

**Hỏi:** `ngAfterContentInit` tương đương gì bên React?

**Đáp:**
- **Không có tương đương.** Render React là traversal đơn thuần — lúc `return JSX` bạn đã có toàn bộ
  cây children để đếm/chỉnh **trước khi DOM được dùng**. Không tồn tại pha "sau khi projected" để hẹn giờ.
- Gọn (không học thêm lifecycle) nhưng cũng là bẫy: đừng tìm chỗ "đợi content xong" — mọi tính toán
  content làm luôn trong body component trước `return`.

---

## 5. Khi nào dùng `cloneElement`, khi nào dùng compound + context?

**Hỏi:** Cả DAY 6 (compound) và DAY 9 đều làm được Tabs — chọn cái nào?

**Đáp:**
- Quy tắc 2026 (theo React docs): **ưu tiên API tường minh** — compound + context (DAY 6) cho đa số case:
  rõ contract, type-check được, thêm con không sửa cha.
- `cloneElement` giới hạn cho thao tác **"trang trí hàng loạt"** mà composition lẻ tẻ quá rườm rà
  (đánh số Steps, gắn divider Breadcrumb). Thấy mình clone khắp nơi là dấu hiệu nên đổi sang compound.

---

## 6. So nhanh Angular ↔ React cho content children?

**Hỏi:** `@ContentChild/@ContentChildren` tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `@ContentChild` / `@ContentChildren` | `Children.toArray` + `find`/`filter` | Duyệt ngay lúc render |
| Truyền context vào content | `cloneElement(child, extraProps)` | Không gộp handler cũ |
| `ngAfterContentInit` | Không có — tính trong body trước `return` | Không pha lifecycle riêng |
| `ng-content` | `{children}` (DAY 5) | Chỉ render, không chỉnh |

---

## 7. Usecase vàng: `Breadcrumb` tự chèn `/` bằng `Children.toArray` thế nào?

**Hỏi:** Muốn `<Breadcrumb><a>A</a><a>B</a></Breadcrumb>` tự có dấu `/` giữa — làm sao không sửa nơi dùng?

**Đáp:**
- Đây là usecase "trang trí hàng loạt" đúng chỗ của Children API: số lượng con bất định, muốn chèn separator giữa mà không bắt nơi dùng tự thêm. Cơ chế: `Children.toArray(children)` phẳng hóa mọi shape (mảng, fragment, `null`) thành mảng gọn + gán key ổn định, `.filter(Boolean)` loại `null/false` (từ render có điều kiện), rồi `map` kèm index để chèn `" / "` giữa các phần.
- Vì sao không dùng `children.map` trực tiếp: `children` có thể là một element đơn (không có `.map`), hoặc fragment — gọi trực tiếp là crash. `Children.toArray` chuẩn hóa trước nên an toàn mọi shape.
- Sai thì sao: quên `filter(Boolean)` thì `false` từ `{cond && <a/>}` thành một "phần" rỗng, separator lệch (hiện `/` thừa). Fix: luôn `toArray(...).filter(Boolean)` trước khi map.

```tsx
import { Children, type ReactNode } from "react";

function Breadcrumb({ children }: { children: ReactNode }) {
  // Chuẩn hóa mọi shape thành mảng phẳng, loại null/false từ render điều kiện
  const parts = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="breadcrumb">
      {parts.map((part, i) => (
        // key theo index ổn vì parts đã ổn định thứ tự sau toArray
        <span key={i}>
          {part}
          {/* Chèn separator giữa các phần, phần cuối không chèn */}
          {i < parts.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
```

---

## 8. `cloneElement` mà không nuốt `onClick` gốc của child thì sao?

**Hỏi:** TabsList clone thêm `onClick` chọn tab, nhưng child vốn đã có `onClick` riêng — xử lý thế nào?

**Đáp:**
- Cơ chế `cloneElement(child, newProps)` là **chồng props mới lên props cũ, không gộp handler**: `onClick` mới thay hẳn `onClick` cũ. Nếu child có `onClick` riêng (log analytics, mở tooltip) là mất luôn, bug "câm" khó phát hiện vì không báo lỗi.
- Fix chuẩn: đọc `child.props.onClick` cũ ra, tạo handler mới gọi **cả hai** — cũ trước, mới sau (hoặc ngược tùy ngữ nghĩa). Đồng thời giữ `isValidElement` check để string child không crash, và giữ `key` gốc để React không remount.
- Quy tắc nhận diện: bất cứ khi nào clone mà key mới là `onClick/onChange/onBlur` (handler), phải tự hỏi "child có handler cùng tên không?" — nếu có thì gộp, không thì mới được chồng trực tiếp.

```tsx
import { Children, cloneElement, isValidElement } from "react";

function TabsList({ children, active, onSelect }: {
  children: React.ReactNode; active: string; onSelect: (v: string) => void;
}) {
  return (
    <div role="tablist">
      {Children.map(children, (child) => {
        // Bỏ qua text node: string không có props để đọc hay clone
        if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child;
        const value = child.props.value ?? ""; // đọc value từ child gốc
        const oldClick = child.props.onClick; // giữ handler gốc của người dùng
        return cloneElement(child, {
          "aria-selected": value === active, // inject trạng thái active cho a11y
          // Gộp 2 handler: gọi cũ trước (giữ hành vi người dùng), rồi mới chọn tab
          onClick: () => { oldClick?.(); onSelect(value); },
        } as Partial<unknown> as Record<string, unknown>);
      })}
    </div>
  );
}
```

---

## 9. Lỗi thực chiến: `children.length` crash khi chỉ có 1 child?

**Hỏi:** `Steps` truyền 1 `<span>` thì `children.length` báo gì? Fix sao?

**Đáp:**
- Khi chỉ có 1 child, React truyền `children` là **một element đơn, không phải mảng** — `.length` là `undefined`, gọi `.map` là crash "children.map is not a function". Truyền 3 child thì `children` thành mảng nên code chạy — bug chỉ lộ khi dùng với 1 child, đúng kiểu bug "demo 3 mục thì xanh, prod 1 mục thì đỏ".
- Cơ chế `Children.count/map` sinh ra để xử lý chính việc này: chúng chuẩn hóa mọi shape (đơn, mảng, fragment, string, null) về một đường duyệt. Không bao giờ đọc `.length`/`.map` trực tiếp trên `children` thô.
- Fix và phòng ngừa: thay mọi `children.length` thành `Children.count(children)`, mọi `children.map` thành `Children.map(children, ...)`. Thêm test với 1 child + với `null` để khóa.

| Viết sai | Viết đúng | Vì sao |
|---|---|---|
| `children.length` | `Children.count(children)` | Đơn child không có `.length` |
| `children.map(...)` | `Children.map(children, ...)` | An toàn mọi shape + fragment |
| `children.filter(...)` | `Children.toArray(children).filter(...)` | Phẳng hóa + key ổn định trước khi lọc |

---

## 10. Lọc child theo `child.type`: chọn đúng `Step` mà bỏ text node thế nào?

**Hỏi:** Muốn `Steps` chỉ đánh số `<Step>`, bỏ qua string chen giữa — kiểm tra kiểu gì?

**Đáp:**
- Cơ chế: mỗi element có `child.type` — với host element (`div`, `span`) thì `type` là string `"div"`; với component (`Step`) thì `type` là chính function `Step`. So sánh `child.type === Step` là cách chọn đúng component, còn `typeof child.type === "string"` là cách phát hiện host element. Kết hợp `isValidElement` trước để loại string/number (chúng không có `.type`).
- Vì sao cần: content projected thực tế lẫn lộn — người dùng chen text, `<br/>`, comment điều kiện. Không lọc thì text cũng bị đánh số "Bước 2" vô nghĩa.
- Sai thì sao: so `child.type.name === "Step"` (so tên string) thì minify build đổi tên là vỡ. Fix: so **tham chiếu** `child.type === Step`, không so tên.

```tsx
import { Children, isValidElement } from "react";

function Step({ title }: { title: string }) {
  return <span>{title}</span>; // component con hợp lệ để Steps đánh số
}

function Steps({ children }: { children: React.ReactNode }) {
  // Lọc: chỉ giữ element có type đúng là Step, bỏ text/host element lạ
  const steps = Children.toArray(children).filter(
    (c) => isValidElement(c) && c.type === Step
  );
  return (
    <ol>
      {steps.map((s, i) => (
        // Đánh số theo vị trí đã lọc, không theo vị trí thô
        <li key={i}>Bước {i + 1}: {s}</li>
      ))}
    </ol>
  );
}
```

---

## 11. Quy tắc nhận diện: khi nào `cloneElement` là đúng, khi nào là mùi đổi sang compound?

**Hỏi:** Cả `cloneElement` và compound (DAY 6) đều làm được Tabs — ranh giới ở đâu?

**Đáp:**
- Hỏi 3 câu theo thứ tự: (1) Có cần **inject prop vào child mà nơi khai báo không biết** không? Không → dùng composition/compound thường. (2) Thao tác có phải **"trang trí hàng loạt" giống nhau** (đánh số, divider, `aria-selected` theo index) không? Có → `cloneElement` hợp. (3) Child có cần **đọc state chung sâu nhiều tầng** (Trigger ở xa Panel) không? Có → compound + context (DAY 6) rõ contract hơn.
- Dấu hiệu mùi: clone rải khắp nơi, mỗi nơi clone một kiểu prop khác nhau; muốn thêm con mới phải sửa hàm clone ở cha; TypeScript phải cast `as Record<string, unknown>` nhiều chỗ. Đó là lúc API đang "xâm nhập" thay vì "hợp tác" — chuyển sang compound: cha cấp context, con tự đọc, thêm con không sửa cha.
- Sai thì sao: lạm dụng clone cho logic nghiệp vụ sâu (clone rồi clone tiếp vào cháu) — code giòn, refactor vỡ hàng loạt. Fix: giữ clone cho UI kit "trang trí" (Steps/Breadcrumb), logic chia sẻ đi đường context/store.

| Tín hiệu | Chọn `cloneElement` | Chọn compound + context |
|---|---|---|
| Đánh số/divider hàng loạt theo index | Đúng — gọn, một chỗ | Thừa — phải viết context cho việc nhỏ |
| Tabs/Accordion nhiều tầng cần state chung | Giòn — cha phải biết hết con | Đúng — con tự đọc context |
| Clone chồng handler khác nhau mỗi nơi | Mùi — dễ nuốt handler gốc | Đúng — mỗi con tự xử lý event |

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 9)
- https://react.dev/reference/react/Children
- https://react.dev/reference/react/cloneElement · https://react.dev/reference/react/isValidElement
