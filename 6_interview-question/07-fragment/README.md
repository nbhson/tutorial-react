# Q7: Sao React phải đẻ ra Fragment? Cứ bọc `div` cho nhanh thì bị gì?

## Câu hỏi

> Muốn nhóm vài element trong JSX mà không thêm node DOM thừa — Fragment dùng để làm gì?
> Nếu lười mà wrap bằng `<div>` cho tiện thì sẽ bị gì (layout, CSS selector, semantics)?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là câu trả lời 30 giây — ba gạch đầu dòng chốt: Fragment để làm gì, bọc div bị gì, và key với Fragment.

- Component chỉ được return **một khối duy nhất**. Ví von: như một phong bì thư chỉ gửi được một tờ — muốn gửi nhiều tờ thì phải có "túi bọc", và Fragment là túi trong suốt không hiện ra ngoài phong bì (DOM). Muốn trả nhiều element cạnh nhau mà không thêm thẻ vào DOM thì bọc bằng Fragment (`<>...</>`).
- Bọc `div` thì trình duyệt vẽ thêm một node thật: dễ vỡ layout flex/grid, vỡ selector CSS (`.cha > .con`), sai ngữ nghĩa (`ul`/`table`).
- Map list mà mỗi dòng trả nhiều element thì dùng `<Fragment key={id}>` — shorthand `<>` không nhận key.

> **Tóm gọn 1 câu:** Fragment là "túi bọc trong suốt" — nhóm nhiều element cho hợp luật một gốc mà không để lại dấu vết nào trong DOM.

## Trả lời chi tiết

### 1. Vì sao "một gốc duy nhất"?

`return` của component là **một expression trả về một React element** (object mô tả UI — xem [`06-jsx`](../06-jsx)). Khi component render nhiều "khối" (header + nội dung + footer), bạn cần "nhóm" chúng — nhưng **không muốn thêm node vào DOM** (vì node thừa = layer HTML thừa).

> 📄 **Code ví dụ:** [`examples/01-1-vi-sao-mot-goc-duy-nhat.tsx`](examples/01-1-vi-sao-mot-goc-duy-nhat.tsx)

### 2. Hai dạng, khi nào dùng cái nào

Mục này phân biệt shorthand `<></>` và `<Fragment key>` — một "túi thường", một "túi có khóa" (key). Biết chọn đúng dạng là trả lời được trắc nghiệm phổ biến nhất của câu này.

> 📄 **Code ví dụ:** [`examples/02-2-hai-dang-khi-nao-dung-cai-nao.tsx`](examples/02-2-hai-dang-khi-nao-dung-cai-nao.tsx)

> Quy tắc nhớ: **cần key → `<Fragment key>`**, chỉ "nhóm" thuần → **`<></>`**.

### 3. `<div>` vs Fragment — bảng so (điểm "ăn điểm")

Mục này đối chiếu hai lựa chọn bọc theo 5 tiêu chí — trả lời trực tiếp vế "lười bọc div thì bị gì" của đề bài.

| Tiêu chí | Wrap bằng `<div>` | Fragment `<></>` |
|---|---|---|
| Node DOM sinh ra | **Có** (một node thật) | **Không** (biên dịch thành "nhóm", không render) |
| Layout/CSS | div = block, **đổi flow** (thêm layer, ảnh hưởng flex/grid parent, selector `>`) | "Trong suốt" (transparent) về layout |
| Semantics | Thêm HTML "vô nghĩa", sai tree (ul không trực tiếp trong section...) | Đúng ngữ nghĩa, DOM sạch |
| A11y/SEO | DOM "sâu" hơn không cần thiết | DOM đúng, tốt hơn |
| Khi nào HỢP LÝ dùng div thật | **Có intent layout** (wrapper flexbox, card, section) | — |

> **Cách đọc bảng này:** đọc ngang từng hàng là một phép so sánh trực tiếp; hàng cuối là "lối thoát" quan trọng — div không phải kẻ xấu, chỉ là đừng dùng khi không có ý đồ layout.

**Kết luận**: không phải "đóng khung" Fragment tốt hơn — **chọn có chủ ý**:
- Wrapper "thuần layout" (flex container, section với style) → **div (hoặc element ngữ nghĩa) là đúng**, vì đó là intent thiết kế.
- Chỉ để **tận dụng cú pháp "một gốc"** mà không muốn thêm node → **Fragment**.

### 4. Chi tiết kỹ thuật (nếu bị hỏi sâu)

- JSX biên dịch: `<div>` → `jsx("div", props)`; `<></>` → `jsx(Fragment, props)` (Fragment là **symbol nội bộ** của React, không phải DOM tag) — reconciliation (xem [`05-virtual-dom`](../05-virtual-dom)) "xuyên qua" Fragment (không tạo node, chỉ nhóm children để so key).
- **Fragment + key khi map**: key là "căn cước" để diff list động (thêm/xóa/đảo) — không có key → React giữ nhầm node theo vị trí (state "nhảy hàng").

## Bẫy khi phỏng vấn

Mục này là 4 phát ngôn sai kinh điển về Fragment — bẫy số 2 (shorthand không nhận key) là "trắc nghiệm" bị hỏi nhiều nhất.

1. **"Fragment nhanh hơn div"** (nói suông) → **không đúng bản chất**: vấn đề không phải "hiệu năng" — mà là **thêm node DOM không cần thiết + phá layout/semantics**.
2. **Dùng `<></>` cho list động có key** → **lỗi**: shorthand không nhận key → dùng `<Fragment key>` (đây là "trắc nghiệm" phổ biến nhất).
3. **"Fragment cho mọi chỗ, bao giờ cũng đúng"** → **sai**: wrapper flexbox/grid/section có intent layout vẫn nên dùng `div`/`section` (element ngữ nghĩa) — Fragment "trong suốt" layout, không thay thế intent thiết kế.
4. **Nhầm Fragment với "div transparent CSS" (`display: contents`)** → **khác**: `display: contents` vẫn là node (lưu DOM, selector/a11y tree vẫn có), Fragment là **không có node** (không "vẽ" gì trong DOM).

## Gợi ý câu chốt

> "Fragment là 'nhóm phía React, không vẽ phía DOM': khi component trả nhiều em mà không muốn thêm node, dùng `<></>` (shorthand, không nhận key) hoặc `<Fragment key>` (đầy đủ, nhận key) cho list động. Dùng `<div>` 'hình thức' khi chưa có intent layout → thêm layer DOM + phá selector/semantics; nếu wrapper có intent thiết kế (flex/grid/section) thì div/section vẫn là đúng lựa chọn."

## Reference

- [React Fragment](https://react.dev/reference/react/Fragment)
- [Why one root element?](https://react.dev/learn/describing-the-ui) — "multiple components per file, single root"
- [`3_react-tutorial/1-jsx-data-display`](../../3_react-tutorial/1-jsx-data-display) — JSX là object, một gốc
- Q5 (Virtual DOM) — Fragment trong reconciliation (xuyên qua, không tạo node)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q6 — JSX biên dịch ra gì?](../06-jsx/README.md) · [Q5 — Virtual DOM?](../05-virtual-dom/README.md)
- **Đào sâu (xuyên nhóm)**: [Q8 — key trong list Fragment](../08-key-index/README.md)
