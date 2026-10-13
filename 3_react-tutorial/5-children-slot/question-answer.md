# DAY 5 — Hỏi & Đáp: Children (slot / ng-content)

> File hỏi–đáp chi tiết cho `3_react-tutorial/5-children-slot`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (Card + Layout chạy được).

---

## 1. `children` là gì? Có phải cú pháp đặc biệt của React?

**Hỏi:** Mọi thứ giữa `<Card>` và `</Card>` đi đâu? Có magic nào không?

**Đáp:**
- **Không có magic.** `children` chỉ là một prop bình thường: JSX giữa thẻ mở/đóng được gói thành
  ReactNode và truyền vào component qua prop tên `children`. "JSX là object, gói vào tham số" — hết.
- Tương đương `<ng-content>` của Angular nhưng không cần directive/select — chỉ là truyền dữ liệu.
- Kiểu dành cho nó: `ReactNode` (element, string, number, fragment, mảng, `null`; boolean/null render ra trống).

```tsx
function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
<Card><p>Nội dung qua children.</p></Card>
```

---

## 2. Named slots trong React viết thế nào? (So với `select` của ng-content)

**Hỏi:** Angular có `<ng-content select="[slot=header]">`, React chia nhiều vùng thế nào?

**Đáp:**
- React **không có `select`** — bạn tự định nghĩa nhiều props kiểu `ReactNode` (`header`, `sidebar`, `footer`).
- Lợi ích hơn cả `select`: **type-check từng slot** (thiếu `header` bắt buộc là báo đỏ), đọc tên prop là biết
  vùng nào nhận gì, không phụ thuộc attribute string dễ gõ sai.
- Trong example, `Layout` có 3 vùng: `header` + `sidebar` (named slots) và `children` (vùng chính trong `<main>`).

```tsx
<Layout header={<h2>Header</h2>} sidebar={<nav>Menu</nav>}>
  <Card>...</Card> {/* → children → <main> */}
</Layout>
```

---

## 3. "Composition > inheritance" nghĩa là gì?

**Hỏi:** Vì sao React cấm/không có thừa kế component?

**Đáp:**
- Function component **không có cơ chế thừa kế** — và đó là chủ ý. Thay vì `class SpecialCard extends Card`,
  bạn **bọc** (`<Card><SpecialContent /></Card>`) hoặc cấu hình qua props.
- Bọc linh hoạt hơn thừa kế: cùng một `Card` dùng lại cho 10 nội dung khác nhau mà không sinh 10 subclass;
  muốn đổi khung chỉ sửa `Card` một chỗ.
- Đây là pattern chuẩn 2026 cho UI kit: layout component quyết **khung**, cha quyết **nội dung**
  (đảo ngược kiểm soát — inversion of control).

---

## 4. Children có bị mutate được không? Muốn đếm/sửa children thì sao?

**Hỏi:** Trong `Card` có thể `children.push(...)` hoặc gắn thêm prop vào children không?

**Đáp:**
- **Không.** Children là dữ liệu bất biến — con chỉ render, không mutate.
- Muốn **đếm/duyệt/chuẩn hóa** → `Children` API: `Children.count`, `Children.map`, `Children.toArray` (DAY 9).
- Muốn **inject prop** vào từng child (Steps, Tabs) → `cloneElement` (DAY 9), nhưng dùng khiêm tốn;
  đa số case nên compound + context (DAY 6).

---

## 5. Children được tạo khi nào? Vì sao quan trọng với memo?

**Hỏi:** `children` trong `<Card>` được tạo trước hay sau khi `Card` render?

**Đáp:**
- **Trước.** Cha (`App`) đánh giá JSX con thành element **rồi mới** gọi `Card` — nên `children` là element có sẵn
  lúc `Card` render.
- Hệ quả cho memo: nếu `App` re-render, mọi JSX trong nó được đánh giá lại → `children` là element **mới**
  (dù nội dung giống) → `memo(Card)` so props thấy khác → vẫn re-render. Muốn `memo` hiệu quả với children
  thì giữ children ổn định (tách component, hoặc để Compiler lo).
- Ngược lại: khi `Layout` re-render vì state **riêng** của nó mà `App` không render lại, `children` cũ được
  React tái sử dụng — cây con không dựng lại.

---

## 6. Khi nào children là function? (Nhá hàng DAY 6)

**Hỏi:** `children` có bắt buộc là JSX không?

**Đáp:**
- Không — `children` có thể là **function** (render props dạng function-as-children): con gọi `children(data)`
  để lấy JSX. Người dùng quyết UI, con giữ state/logic.
- Chi tiết và ví dụ `Mouse` xem DAY 6. Nhận diện pattern: thấy `{children(pos)}` trong thân component
  là biết đang dùng children-dạng-hàm.

---

## 7. Chỉ muốn hiện child đầu tiên thì sao? (Lọc children ở chỗ nhận)

**Hỏi:** `Card` nhận 2 dòng `<p>` nhưng chỉ muốn hiển thị dòng đầu?

**Đáp:**
- Cách đơn giản nhất: sửa ở **chỗ truyền** — xóa dòng không cần trong `App`.
- Muốn `Card` tự lọc dù cha truyền mấy dòng (sửa ở **chỗ nhận**) — đúng use-case Children API (DAY 9):

```tsx
import { Children } from "react";

function Card({ children }: { children: ReactNode }) {
  const first = Children.toArray(children)[0]; // lấy phần tử đầu, bỏ phần còn lại
  return <div className="card">{first ?? null}</div>;
}
```

- `Children.toArray` phẳng hóa mọi dạng children (1 element, mảng, fragment) thành mảng gọn + tự gán key,
  nên `[0]` luôn là "dòng đầu" bất kể cha truyền kiểu gì.
- `?? null` phòng khi `Card` không có children nào (`toArray([])[0]` là `undefined`).
- Kết quả: `App` vẫn truyền 2 dòng nhưng chỉ dòng đầu hiển thị — dòng 2 bị `Card` "nuốt".

---

## 8. So nhanh Angular ↔ React cho slot?

**Hỏi:** Mỗi khái niệm ng-content tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `<ng-content>` | `{children}` | Không directive, chỉ là prop |
| `<ng-content select="...">` | props `header`/`sidebar` kiểu `ReactNode` | Type-check được từng slot |
| Content projection + `@ContentChild` đọc/sửa | `Children` API + `cloneElement` (DAY 9) | React duyệt ngay lúc render |
| Kế thừa component | Composition (bọc) | React không có thừa kế component |

---

## 11. Children/slot trong thực tế dùng cho việc nào? (Usecase + quy tắc nhận diện)

**Hỏi:** Khi nào thì thiết kế component nhận `children` thay vì props thường?

**Đáp:** 5 usecase chuẩn:
1. **Layout** — `SidebarLayout`, `DashboardShell`: khung cố định, mỗi trang đổ `children` khác nhau vào (không thì copy khung khắp nơi).
2. **Card/Modal/Panel** — `Card` bọc nội dung bất kỳ; `Modal` nhận `children` làm body + slot `footer` riêng cho nút. Team UI xây 1 lần, cả app dùng.
3. **Provider/guard bọc** — `<RequireAuth><AdminPage/></RequireAuth>`, `<Suspense>` — children là "phần được bảo vệ / cung cấp context".
4. **Compound component** — `Tabs` + `Tabs.List`/`Tabs.Panel`: cha quản state, con khai báo qua children, API đọc như HTML.
5. **Thay HOC** — `<LoadingBoundary fallback={...}>{content}</LoadingBoundary>` rõ hơn `withLoading(Component)` bọc ngoài khó type.

**Quy tắc nhận diện:** thấy mình copy 1 khung/bọc đi bọc lại nhiều chỗ, hoặc component cần nhận "cả mảng JSX"
thay vì 1–2 chuỗi — đó là chỗ cho children/slot.

**Gặp nhau với ref:** modal/trigger đo DOM — `children` là nội dung modal, `ref` là node để focus khi mở + đo vị trí đặt popup (nối DAY 4).

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 5)
- https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children
- https://react.dev/learn/reusing-logic-with-custom-hooks (tư duy composition)
