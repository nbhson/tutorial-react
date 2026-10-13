# Q5: React render lại UI bằng Virtual DOM, cơ chế diff chạy ra sao và vì sao phải dùng key?

## Câu hỏi

> React render lại UI bằng Virtual DOM — cây object đó dùng để làm gì, và nó có nhanh hơn sửa DOM thật không?
> Khi state đổi thì reconciliation (diff) chạy theo cơ chế nào? key trong list quan trọng đến mức nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Virtual DOM = một cây object JS nhẹ** (`{ type, props, children }`) mô tả UI, **không phải** DOM thật. Mỗi lần render, React tạo cây object mới trong bộ nhớ.
- **Reconciliation (diff)**: so cây object cũ (đang hiển thị) với cây mới (vừa render), tìm **chỉ phần khác**, rồi **patch đúng các node đó** vào DOM thật. DOM thật đắt (layout/paint, reflow), object JS rẻ → "vẽ lại bản sao trong bộ nhớ rồi sửa ít" nhanh hơn "sờ DOM trực tiếp".
- **`key`** là "căn cước công dân" của mỗi phần tử trong list: React dùng key để biết "phần tử nào là phần tử nào" khi thêm/xóa/đảo → giữ đúng state nội bộ, tránh nhầm lẫn. Dùng `key={index}` hoặc thiếu key → bug "state nhảy hàng".
- Virtual DOM **không bị thay thế** bởi React Compiler (19.3, 1.0): Compiler chỉ giảm số lần render thừa (auto-memo); khi đã render, diff vẫn chạy như cũ.

## Trả lời chi tiết

### 1. Virtual DOM là gì, chính xác

```tsx
// JSX biên dịch thành object (mô tả UI), KHÔNG phải DOM node thật:
<p onClick={handler}>Count: {count}</p>
// ≈ jsx("p", { onClick: handler, children: `Count: ${count}` })
```

- React giữ **2 bản**: cây **cũ** (đang hiển thị trong DOM thật) và cây **mới** (vừa render).
- So 2 bản (reconciliation) → tính ra **chỉ node nào cần thay** → **commit** vào DOM thật (DOM mutation + reflow/paint).
- Điều kiện tiên quyết: **render thuần khiết** (pure) — cùng props/state → cùng JSX. Nếu render có side-effect (đọc biến ngoài, mutation, `Math.random()`), 2 bản so với nhau không có nghĩa gì → React (đặc biệt StrictMode) sẽ lộ bug.

### 2. Luồng reconciliation (bước-by-bước)

```
1. state/props đổi (setCount, prop mới, context)
2. React schedule re-render (concurrent: có thể tạm dừng/ưu tiên)
3. Chạy lại component function → cây Virtual DOM MỚI (object, chưa chạm DOM)
4. Diff cây MỚI vs cây CŨ (so type, props, key trong list)
5. Commit: chỉ patch node khác biệt vào DOM thật (reflow/paint)
```

Ví dụ `Counter` (chỉ `<p>` đổi, `<button>` giữ nguyên trong DOM thật):

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Tăng</button>
    </>
  );
}
```

### 3. Diff chạy theo "type + key", không phải "index"

- **Same type + same key** ở cùng vị trí → React **giữ lại node DOM cũ**, chỉ cập nhật props/children (không recreate).
- **Type khác** → React **cắt toàn bộ subtree con** (không diff tiếp), create node DOM mới (vì DOM node không chuyển đổi "tag" được).
- **key trong list** → key là "chữ ký" ổn định: thêm/xóa/đảo, React so key để biết "item nào là item nào".

```tsx
// ĐÚNG — key ổn định theo id:
{posts.map((p) => <PostCard key={p.id} post={p} />)}

// SAI — index làm key: xóa item đầu → state nội bộ "nhảy" (input của item
// thứ 2 nhận state của item thứ 1) vì React "giữ nhầm" node theo vị trí.
{posts.map((p, i) => <PostCard key={i} post={p} />)}
```

### 4. "Virtual DOM có nhanh hơn DOM thật không?" (bẫy kinh điển)

- **Câu trả lời đúng**: **Không hẳn**, với "so sánh thuần" 1 lần. Object JS rẻ hơn DOM mutation (reflow/paint đắt), nên React chọn **giới hạn số lần sửa DOM thật** (chỉ patch phần khác), thay vì "sờ DOM trực tiếp" (như trước đây, hay như template engine).
- **Không phải "virtualization" (hiding offscreen list items)** — đừng nhầm Virtual DOM (object model) với list virtualization (render chỉ phần visible trong viewport).
- **React Compiler (1.0)** giảm **số lần render thừa** (auto-memo), không thay reconciliation — diff vẫn chạy khi đã render.

### 5. Đối chiếu Angular (điểm "ăn điểm" cho người từ Angular)

| Angular (Zone.js) | React |
|---|---|
| Digest cycle + dirty checking: Zone.js **quét** mọi binding mỗi khi có sự kiện (click, timer, HTTP) | Re-render + diff **chủ động**: state đổi qua `setState` (setter), React "biết" ngay |
| `trackBy` trong `*ngFor` | `key` trong `.map()` — cùng mục đích: định danh phần tử khi diff |
| Renderer (Zone-patched) | JSX + reconciliation |

> Nói cách khác: **Angular "nghe lén" (Zone patch)**, **React "tự báo" (setter + unidirectional data flow)** — nên React không cần "quét" toàn bộ binding như Angular 2-14 (Angular 15+ đã có signal-based, giảm scope của "nghe lén").

## Bẫy khi phỏng vấn

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
