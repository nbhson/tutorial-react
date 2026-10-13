# Q12: Component nhận nhiều children mà chỉ muốn hiện đứa đầu tiên, em xử lý sao?

## Câu hỏi

> Mình viết một component nhận `children` (slot) nhưng thực ra chỉ muốn render child đầu tiên, bỏ mấy child còn lại — phía nhận thì làm sao?
> Lấy `children[0]` trực tiếp có an toàn không, hay phải dùng `Children.toArray`?

## Trả lời ngắn (elevator pitch, 30 giây)
- `children` không phải lúc nào cũng là mảng (một element, chuỗi, fragment...) nên `children[0]` dễ trả sai hoặc `undefined`.
- Lấy đứa đầu an toàn: `Children.toArray(children)[0]` — vừa phẳng hóa mọi dạng, vừa có key ổn định.
- Nhưng tự hỏi trước: chỉ hiện 1 đứa thì API nên nhận **1 prop `ReactNode` đặt tên rõ**, đừng nhận `children` rồi lén lọc.

## Trả lời chi tiết

### 1. Vì sao `children[0]` DANG (không an toàn)

`children` có thể là **nhiều shape** (xem [`5-children-slot`](../../3_react-tutorial/5-children-slot), [`9-children-api`](../../3_react-tutorial/9-children-api)):
- 1 element (không có `.length`)
- string / number
- fragment (`<>...</>` — flatten nhiều child)
- mảng / mảng lồng
- `null` / `false` / `true` (bị bỏ qua khi render)

Gọi `children[0]` khi `children` là **1 element đơn** → **`undefined`** (element không "index" được). Khi là **fragment** → `[0]` là child thứ nhất bên trong fragment, **không nhất định là "child đầu bạn đưa vào"** → sai kết quả mà không báo lỗi.

```tsx
// ❌ DANG — children không phải mảng
function FirstChildOnly({ children }: { children: ReactNode }) {
  return <div>{children[0]}</div>; // ❌ undefined nếu children = 1 element
}
// Dùng: <FirstChildOnly><a/><b/></FirstChildOnly> → children = [a, b] → [0] = a (đúng)
//        <FirstChildOnly><a/></FirstChildOnly>     → children = <a/>   → [0] = undefined (sai!)
```

### 2. Cách an toàn: `Children.toArray` (đáp án chuẩn khi thật sự cần lọc)

```tsx
import { Children } from "react";

function FirstChildOnly({ children }: { children: ReactNode }) {
  const arr = Children.toArray(children); // flatten + gán key ổn định
  return <div>{arr[0] ?? null}</div>;     // [0] an toàn (luôn là mảng)
}
```

`Children.toArray`:
- **phẳng hóa** mảng lồng + **fragment** (không giữ node fragment, chỉ giữ children bên trong).
- **bỏ qua** `null`/`false`/`true` (khớp hành vi render).
- **gán key** ổn định (prefix `.$`) — dùng được cho diff (nhớ: key này chỉ để React diff, **không phải id nghiệp vụ**).
- **trả mảng luôn** (dù input là 1 element) → `[0]` hợp lệ mọi shape.

### 3. Nhưng "đúng nhất": đặt câu hỏi **API design** (điểm ăn điểm)

"Chỉ hiện child đầu tiên" nghĩa là **component này chỉ nên nhận MỘT child**. Thay vì "nhận `children` rồi tự lọc", **nên định nghĩa lại**:

```tsx
// ✅ "đúng nhất" — 1 slot tường minh (1 prop ReactNode), không cần "lọc"
function Alert({ title }: { title: ReactNode }) {
  return (
    <div className="alert">
      <strong>{title}</strong> {/* "child duy nhất" = title */}
    </div>
  );
}
```

**Vì sao "composition tường minh" thắng "lọc children"?**

| Cách | "đúng lúc nào" |
|---|---|
| `Children.toArray` + `[0]` | Bạn **quyết định** "component này cần lọc" (rare) — hoặc viết **thư viện** linh hoạt nhận nhiều shape |
| **1 prop `ReactNode`** (đặt lại API) | "đúng" nếu ý đồ là **1 slot** (đa số trường hợp) — type-check, IDE gợi ý, không cần lọc |
| Named slots (nhiều prop `ReactNode`: `header`, `body`) | Khi muốn nhiều khe (xem DAY 5) |

> **Tư duy**: "lọc children" là **đưa quyết định vào phần hiển thị** (bên trong component). React ưu tiên **quyết định ở API** (props có tên) — component chỉ "vẽ". Nếu lọc vì component "thông minh", nên **tách API** (props tường minh) thay vì lọc.

### 4. "Lọc nhiều child" (nếu cần, không chỉ child đầu)

```tsx
import { Children, isValidElement } from "react";

// Chỉ "hiện" child là element (bỏ string/number) — "gọt" shape
function OnlyElements({ children }: { children: ReactNode }) {
  return (
    <div>
      {Children.toArray(children).filter(isValidElement)}
    </div>
  );
}
```

- **Gọt child** (filter/clone) — chỉ khi **thư viện** cần linh hoạt.
- **"Đặt lại API"** (1 prop) — an toàn hơn (type-check, rõ ý đồ).
- Khi muốn **inject prop hàng loạt** (Tabs, Steps) → dùng **`cloneElement`** (DAY 9), không chỉ filter.

### 5. Đối chiếu Angular (điểm ăn điểm cho người từ Angular)

| React | Angular | "Cùng" vấn đề |
|---|---|---|
| `children` (slot mặc định) | `<ng-content>` (slot mặc định) | Cùng gom "nội dung giữa thẻ" |
| Named slots (props `ReactNode`) | `<ng-content select="[slot=x]">` | Chọn khe theo tên |
| `Children.toArray` + filter | Không có tương đương trực tiếp (Angular chọn slot cụ thể) | React nhận "nhiều child mặc định", Angular "chọn" slot |
| `cloneElement` (inject prop) | `@ContentChild` + template | Sửa nội dung projected |

> **Lời nói với interviewer**: "React truyền `children` (nhiều child mặc định) vào component, Angular chọn slot cụ thể (`<ng-content select>`). Vì vậy 'lọc child đầu ở chỗ nhận' thường xuyên hơn ở React — và cách đúng nhất vẫn là **đặt lại API bằng props tường minh**."

## Bẫy khi phỏng vấn

1. **Truy cập `children[0]` trực tiếp** → **DANG** (shape bất định, undefined/sai nếu fragment). Fix: **`Children.toArray(children)[0]`**.
2. **"Lọc child" thay vì "đặt lại API"** → đúng khi thật cần linh hoạt (thư viện); **sai** khi component chỉ cần 1 child (nhanh hơn đặt 1 prop `ReactNode`).
3. **Mong `toArray` giữ đúng 1-1 tất cả** → toArray **phẳng hóa fragment + bỏ falsy** (`null`/`false`/`true` mất) — giữ thứ tự của child hợp lệ, nhưng falsy bị loại.
4. **"Clone child mà quên gộp handler"** (`cloneElement` ghi đè `onClick` mà không gọi handler cũ) → mất hành vi người dùng đặt ở nơi khai báo (DAY 9). Fix: gộp handler (gọi cũ + mới).
5. **"Tin key tự gán của toArray là id nghiệp vụ"** → **sai**: key này chỉ để diff React (prefix `.$`), không phải id dữ liệu.

## Gợi ý câu chốt

> "`children` không phải mảng ở shape đơn — truy cập `children[0]` sẽ rơi vào dạng `undefined` hoặc sai. Cách an toàn để lấy child đầu là `Children.toArray(children)[0]` (phẳng hóa mọi shape, trả mảng). Nhưng đúng nhất theo tư duy React là **đặt lại API bằng 1 prop `ReactNode` tường minh** (1 slot, không cần lọc) — type-check, rõ ý đồ. Điểm khác Angular: Angular chọn slot cụ thể (`<ng-content select>`), React truyền children mặc định — nên 'lọc child ở chỗ nhận' là chuyện hợp lý hơn ở React, và vẫn nên ưu tiên props tường minh."

## Reference

- [`3_react-tutorial/5-children-slot`](../../3_react-tutorial/5-children-slot) — `children` là 1 prop đặc biệt, named slot, composition
- [`3_react-tutorial/9-children-api`](../../3_react-tutorial/9-children-api) — `Children.toArray/map/forEach`, `isValidElement`, `cloneElement`
- [`3_react-tutorial/6-render-props-compound`](../../3_react-tutorial/6-render-props-compound) — thay "lọc children" bằng compound (khi cần nhiều slot có tên)
- Q8 (key={index}) — key của `toArray` chỉ để diff, không phải id nghiệp vụ
- Q6 (JSX) — JSX là object, gói vào tham số hàm (`children` chỉ là 1 prop)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q6 — JSX biên dịch ra gì (children là gì trong code?)](../06-jsx/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — typing children (tuple as const, discriminated union)?](../35-type-safety/README.md)
