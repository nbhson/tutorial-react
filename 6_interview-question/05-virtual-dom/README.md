# Q5: Em nghe nói React có Virtual DOM — nó là gì, cập nhật giao diện kiểu gì mà không vẽ lại cả trang?

## Câu hỏi

> React render lại UI bằng Virtual DOM — cây object đó dùng để làm gì, và nó có thật sự nhanh hơn sửa DOM trực tiếp không?
> Khi state đổi thì reconciliation (diff) chạy theo cơ chế nào? key trong list quan trọng đến mức nào?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là câu trả lời 30 giây — đủ ba ý: Virtual DOM là gì, so diff thế nào, và key đóng vai gì.

- React không vẽ thẳng lên trình duyệt. Mỗi lần vẽ nó tạo một **bản mô tả giao diện bằng object JS** (rẻ), so với bản trước để tìm đúng chỗ khác nhau, rồi chỉ sửa mấy chỗ đó trên DOM thật (đắt). Ví von: như architect sửa trên bản vẽ giấy (rẻ, xoắn xới thoải mái) trước khi đục tường nhà thật (đắt).
- So theo "loại + key": cùng loại thì giữ node cũ, khác loại thì vẽ mới.
- `key` là "căn cước" của từng dòng trong list để so không nhầm hàng — vì sao thì xem Q8.

> **Tóm gọn 1 câu:** Virtual DOM là "bản thảo giấy" để diff — sửa trên giấy rẻ, đục tường thật (DOM) chỉ một lần cuối cùng ở đúng chỗ cần sửa.

## Trả lời chi tiết

### 1. Virtual DOM là gì, chính xác

> 📄 **Code ví dụ:** [`examples/01-1-virtual-dom-la-gi-chinh-xac.tsx`](examples/01-1-virtual-dom-la-gi-chinh-xac.tsx)

- React giữ **2 bản**: cây **cũ** (đang hiển thị trong DOM thật) và cây **mới** (vừa render).
- So 2 bản (reconciliation) → tính ra **chỉ node nào cần thay** → **commit** vào DOM thật (DOM mutation + reflow/paint).
- Điều kiện tiên quyết: **render thuần khiết** (pure) — cùng props/state → cùng JSX. Nếu render có side-effect (đọc biến ngoài, mutation, `Math.random()`), 2 bản so với nhau không có nghĩa gì → React (đặc biệt StrictMode) sẽ lộ bug.

### 2. Luồng reconciliation (bước-by-bước)

Mục này đi qua 5 bước từ lúc state đổi đến lúc DOM thật được patch — thuộc được luồng này là trả lời "cập nhật giao diện kiểu gì" trọn vẹn.

```
1. state/props đổi (setCount, prop mới, context)
2. React schedule re-render (concurrent: có thể tạm dừng/ưu tiên)
3. Chạy lại component function → cây Virtual DOM MỚI (object, chưa chạm DOM)
4. Diff cây MỚI vs cây CŨ (so type, props, key trong list)
5. Commit: chỉ patch node khác biệt vào DOM thật (reflow/paint)
```

Ví dụ `Counter` (chỉ `<p>` đổi, `<button>` giữ nguyên trong DOM thật):

> 📄 **Code ví dụ:** [`examples/02-2-luong-reconciliation-buoc-by-buoc.tsx`](examples/02-2-luong-reconciliation-buoc-by-buoc.tsx)

### 3. Diff chạy theo "type + key", không phải "index"

- **Same type + same key** ở cùng vị trí → React **giữ lại node DOM cũ**, chỉ cập nhật props/children (không recreate).
- **Type khác** → React **cắt toàn bộ subtree con** (không diff tiếp), create node DOM mới (vì DOM node không chuyển đổi "tag" được).
- **key trong list** → key là "chữ ký" ổn định: thêm/xóa/đảo, React so key để biết "item nào là item nào".

> 📄 **Code ví dụ:** [`examples/03-3-diff-chay-theo-type-key-khong-phai.tsx`](examples/03-3-diff-chay-theo-type-key-khong-phai.tsx)

### 4. "Virtual DOM có nhanh hơn DOM thật không?" (bẫy kinh điển)

Mục này là chỗ "ăn điểm hay mất điểm" của câu hỏi: trả lời bừa "nhanh hơn" là mất; trả lời có điều kiện là thắng.

- **Câu trả lời đúng**: **Không hẳn**, với "so sánh thuần" 1 lần. Object JS rẻ hơn DOM mutation (reflow/paint đắt), nên React chọn **giới hạn số lần sửa DOM thật** (chỉ patch phần khác), thay vì "sờ DOM trực tiếp" (như trước đây, hay như template engine).
- **Không phải "virtualization" (hiding offscreen list items)** — đừng nhầm Virtual DOM (object model) với list virtualization (render chỉ phần visible trong viewport).
- **React Compiler (1.0)** giảm **số lần render thừa** (auto-memo), không thay reconciliation — diff vẫn chạy khi đã render.

**Tại sao "thắng" dù thêm bước trung gian?**

```
Direct DOM (jQuery):
  click → setClass + setText + setStyle + ...  (10 lần chạm DOM thật)
          → 10 lần reflow/paint (đắt, có thể)

React (v DOM):
  click → setState → render (v DOM mới)
        → diff (object JS, RẺ, không reflow)
        → commit: chỉ 1 lần setClass thật (phần khác)
        → 1 lần reflow/paint (gộp, rẻ hơn)
```

- **v DOM không "thay thế" DOM mutation** — nó **giới hạn số lần** DOM mutation thật: **batch** (ghép nhiều thay đổi) rồi **commit** (patch) một lần. Không phải "v DOM thay thế DOM mutation".
- **Diff là object JS, rẻ** — so 2 object JS (memory, cache line friendly) **không trigger reflow**. Chạm DOM thật (mutate) **đắt** (reflow + paint, blocking main thread).
- → 1 bước diff (rẻ) **đổi lấy** ít bước DOM mutation (đắt) → **lãi** (thắng).

**Khi v DOM không thắng** (trường hợp hợp pháp):

| Case | Tại sao không thắng |
|---|---|
| **1 update đơn, 1 attribute** (vd `textContent = 1`) | Direct DOM = 1 op (rẻ). v DOM: render + diff + commit (3 bước) → chậm hơn |
| **High-frequency (60fps, canvas/SVG)** | v DOM overhead > DOM mutation → dùng `requestAnimationFrame` + canvas/SVG direct |
| **List 50k item, scroll** | Diff 50k node = đắt → **virtualization** (render chỉ phần visible) + v DOM |

> **Cách đọc bảng này:** mỗi hàng là một "lỗ hổng" của Virtual DOM — nhớ 3 case này để trả lời phản biện "vậy khi nào direct DOM tốt hơn?" một cách tự tin.

### 5. Đối chiếu Angular (điểm "ăn điểm" cho người từ Angular)

| Angular (Zone.js) | React |
|---|---|
| Digest cycle + dirty checking: Zone.js **quét** mọi binding mỗi khi có sự kiện (click, timer, HTTP) | Re-render + diff **chủ động**: state đổi qua `setState` (setter), React "biết" ngay |
| `trackBy` trong `*ngFor` | `key` trong `.map()` — cùng mục đích: định danh phần tử khi diff |
| Renderer (Zone-patched) | JSX + reconciliation |

> Nói cách khác: **Angular "nghe lén" (Zone patch)**, **React "tự báo" (setter + unidirectional data flow)** — nên React không cần "quét" toàn bộ binding như Angular 2-14 (Angular 15+ đã có signal-based, giảm scope của "nghe lén").

## Bẫy khi phỏng vấn

Mục này là 5 bẫy kinh điển xoay quanh Virtual DOM — bẫy số 1 ("nhanh hơn vì object rẻ") đánh gục vô số ứng viên mỗi năm.

1. **Tưởng "Virtual DOM nhanh hơn" vì "object rẻ"** → trả lời "có" là sai: nhanh là vì **giới hạn số lần chạm DOM thật** (chỉ patch phần khác), không phải "đoán object rẻ hơn DOM".
2. **Nhầm Virtual DOM với list virtualization** (thư viện như `react-window`, `@tanstack/virtual`) → 2 thứ khác nhau: 1 là model, 1 là "chỉ render phần visible".
3. **`key={index}` trong list động** → state nội bộ "nhảy" khi thêm/xóa/đảo. Key phải ổn định (id), chỉ index hợp lệ cho list **tĩnh, không bao giờ đổi thứ tự**.
4. **Sửa DOM bằng ref trong render** (`ref.current.textContent = ...`) → phá diff: cây Virtual DOM không "biết" thay đổi → lần render sau "mất" thay đổi đó. Fix: cập nhật UI qua **state/props**, ref chỉ cho imperative cần thiết (focus, scroll, measure).
5. **`memo` bừa khắp nơi "để tối ưu Virtual DOM"** → diff đã rẻ; `memo` sai chỗ chỉ thêm overhead. Bật **React Compiler** (auto-memo) là cách "sạch" hơn trong 2026.

## Gợi ý câu chốt

> "Virtual DOM là bản mô tả object của UI, dùng để **giới hạn số lần sửa DOM thật** (reflow/paint) — DOM thật vẫn là thứ hiển thị trên màn hình, Virtual DOM chỉ là 'bản thảo' để tính xem chỗ nào cần sửa. Reconciliation so 2 bản (cũ/mới) theo **type + key**, chỉ patch phần khác; `key` là chữ ký ổn định cho list động. React Compiler (1.0) không thay reconciliation mà **giảm render thừa** (auto-memo), nên diff vẫn là thứ 'nặng' nhất trong pipeline render — cũng là thứ React 19 'lo' (concurrent + Suspense) để không block main thread."

## Reference

- [React: Render & Commit](https://react.dev/learn/render-and-commit)
- [React: Preserving & Resetting State (key)](https://react.dev/learn/preserving-and-resetting-state)
- [React Compiler](https://react.dev/learn/react-compiler) — auto-memo, không thay diff
- Tutorial nội bộ: [`3_react-tutorial/0-react-explore/virtual-dom.md`](../../3_react-tutorial/0-react-explore/virtual-dom.md) (đầy đủ reconciliation + key + bảng so sánh Angular)
- Q3 (StrictMode) — render pure là "điều kiện" để diff có ý nghĩa

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q8 — key là index thì sao?](../08-key-index/README.md) · [Q6 — JSX biên dịch ra gì?](../06-jsx/README.md)
- **Đào sâu (xuyên nhóm)**: [Q30 — từ setState đến DOM qua các pha nào?](../30-rerender-pipeline/README.md)
