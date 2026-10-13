# Q7: Sao React phải đẻ ra Fragment? Cứ bọc `div` cho nhanh thì bị gì?

## Câu hỏi

> Muốn nhóm vài element trong JSX mà không thêm node DOM thừa — Fragment dùng để làm gì?
> Nếu lười mà wrap bằng `<div>` cho tiện thì sẽ bị gì (layout, CSS selector, semantics)?

## Trả lời ngắn (elevator pitch, 30 giây)

- Một component React phải trả về **một element gốc duy nhất** (return là một expression). Khi muốn trả nhiều "em" mà không muốn thêm node vào DOM, dùng **Fragment** (`<></>`, hay `<Fragment>` khi cần props — đặc biệt `key`).
- **`<div>` tạo ra thật một node DOM** — Fragment **không tạo node nào** (biên dịch thành `jsxs(Fragment, ...)`), chỉ "nhóm" các children về mặt React.
- Dùng `<div>` thay Fragment gây **3 hậu quả**: (1) **thay đổi layout/semantics** (div là block, phá flex/absolutely-positioned parent, thêm layer HTML "vô nghĩa"), (2) **phá CSS selector** (`.parent > child` mất vì có div chen giữa), (3) **accessibility/SEO** — nhét element ngữ nghĩa `<ul>`, `<table>`... vào div làm sai cấu trúc tài liệu.
- Fragment có `key` (dạng `<Fragment key>`) — shorthand `<></>` **không nhận được key** (đó là lý do khi map list trả nhiều element phải dùng `<Fragment key={id}>`).

## Trả lời chi tiết

### 1. Vì sao "một gốc duy nhất"?

`return` của component là **một expression trả về một React element** (object mô tả UI — xem [`06-jsx`](../06-jsx)). Khi component render nhiều "khối" (header + nội dung + footer), bạn cần "nhóm" chúng — nhưng **không muốn thêm node vào DOM** (vì node thừa = layer HTML thừa).

```tsx
// ❌ Thêm <div> "vô nghĩa" vào DOM
function Card() {
  return (
    <div>                // <-- layer DOM thừa
      <div className="card-header">...</div>
      <div className="card-body">...</div>
    </div>
  );
}

// ✅ Fragment: nhóm về phía React, không tạo node
function Card() {
  return (
    <>
      <div className="card-header">...</div>
      <div className="card-body">...</div>
    </>
  );
}
```

### 2. Hai dạng, khi nào dùng cái nào

```tsx
// (a) Shorthand — KHÔNG nhận props (không key):
<>{children}</>

// (b) Dạng đầy đủ — NHẬN key (đặc biệt cần khi map list trả >1 element):
import { Fragment } from "react";
items.map((it) => (
  <Fragment key={it.id}>
    <div className="head">{it.title}</div>
    <div className="foot">{it.meta}</div>
  </Fragment>
));
```

> Quy tắc nhớ: **cần key → `<Fragment key>`**, chỉ "nhóm" thuần → **`<></>`**.

### 3. `<div>` vs Fragment — bảng so (điểm "ăn điểm")

| Tiêu chí | Wrap bằng `<div>` | Fragment `<></>` |
|---|---|---|
| Node DOM sinh ra | **Có** (một node thật) | **Không** (biên dịch thành "nhóm", không render) |
| Layout/CSS | div = block, **đổi flow** (thêm layer, ảnh hưởng flex/grid parent, selector `>`) | "Trong suốt" (transparent) về layout |
| Semantics | Thêm HTML "vô nghĩa", sai tree (ul không trực tiếp trong section...) | Đúng ngữ nghĩa, DOM sạch |
| A11y/SEO | DOM "sâu" hơn không cần thiết | DOM đúng, tốt hơn |
| Khi nào HỢP LÝ dùng div thật | **Có intent layout** (wrapper flexbox, card, section) | — |

**Kết luận**: không phải "đóng khung" Fragment tốt hơn — **chọn có chủ ý**:
- Wrapper "thuần layout" (flex container, section với style) → **div (hoặc element ngữ nghĩa) là đúng**, vì đó là intent thiết kế.
- Chỉ để **tận dụng cú pháp "một gốc"** mà không muốn thêm node → **Fragment**.

### 4. Chi tiết kỹ thuật (nếu bị hỏi sâu)

- JSX biên dịch: `<div>` → `jsx("div", props)`; `<></>` → `jsx(Fragment, props)` (Fragment là **symbol nội bộ** của React, không phải DOM tag) — reconciliation (xem [`05-virtual-dom`](../05-virtual-dom)) "xuyên qua" Fragment (không tạo node, chỉ nhóm children để so key).
- **Fragment + key khi map**: key là "căn cước" để diff list động (thêm/xóa/đảo) — không có key → React giữ nhầm node theo vị trí (state "nhảy hàng").

## Bẫy khi phỏng vấn

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
