# Q11: Cha muốn bấm nút là focus vào ô input nằm trong con, em làm thế nào?

## Câu hỏi

> Component con có một input, và cha muốn kích hoạt hành vi của con (focus input đó, reset form con…) thì làm thế nào — dùng props/event hay phải gọi thẳng vào con?

## Trả lời ngắn (elevator pitch, 30 giây)
- React không khuyến khích cha gọi thẳng method con. Cách đúng chất là **đổi hành vi bằng props/state**: muốn con focus khi có lỗi thì truyền prop `error`, con tự focus.
- Thật cần gọi (component dùng chung) thì con dùng `useImperativeHandle` để lộ đúng 1–2 method (`focus`, `clear`), cha gọi qua ref.
- Đừng truyền ref DOM trần xuống: cha biết hết ruột gan con, con đổi giao diện là cha vỡ.

## Trả lời chi tiết

### 1. Đường chính: props/event — cha ra lệnh bằng dữ liệu

React là **một chiều**: con chỉ nhận props, không biết ai là cha. Muốn con làm gì thì cha **đổi props**, con tự phản ứng. Gọi thẳng method con vừa khó test, vừa khó tái dùng (ai giữ sự thật?).

> 📄 **Code ví dụ:** [`examples/01-1-uong-chinh-props-event-cha-ra-lenh.tsx`](examples/01-1-uong-chinh-props-event-cha-ra-lenh.tsx)

- Muốn con "focus khi lỗi" → prop `error`/`focusSignal` + effect như trên.
- Muốn con "reset" → prop `resetToken` tăng dần, hoặc dùng **`key`** để ép mount lại sạch (xem [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction)).

**Nguyên tắc**: trước khi nghĩ tới gọi method, tự hỏi **"hành vi này viết được bằng props/state không?"** — viết được thì đó luôn là đáp án đúng.

### 2. Đường dự phòng: `useImperativeHandle` — con chủ động lộ 1–2 method

Chỉ dùng khi hành vi **không gắn được với state** (focus theo click tự do, clear từ toolbar ngoài) và component là hàng dùng chung:

> 📄 **Code ví dụ:** [`examples/02-2-uong-du-phong-useimperativehandle-con-chu-ong.tsx`](examples/02-2-uong-du-phong-useimperativehandle-con-chu-ong.tsx)

Điểm mấu chốt (nói "ăn điểm" với interviewer):
- **React 19**: `ref` là **prop thường** (bỏ `forwardRef` — xem [`02-react-18-vs-19`](../02-react-18-vs-19/README.md)) — function component nhận `ref` như props bình thường.
- **`key` và `ref` là hai kênh riêng**: `key` React giữ để so diff (Q8), con không đọc được; `ref` là kênh cha nhận handle con lộ ra.
- **Lộ ít, kiểm soát nhiều**: con chọn chính xác method nào "ra ngoài" — khác với "truyền ref DOM" (lộ toàn bộ node).

### 3. "Truyền ref xuống, con gắn vào input" (nhanh nhưng thô)

> 📄 **Code ví dụ:** [`examples/03-3-truyen-ref-xuong-con-gan-vao-input.tsx`](examples/03-3-truyen-ref-xuong-con-gan-vao-input.tsx)

- **Ưu điểm**: không cần `useImperativeHandle`, type đơn giản.
- **Nhược điểm**: cha **biết con có input** (lộ nội bộ) — con đổi giao diện (input thành textarea) là type của cha sai theo.
- **Khi nào dùng**: component nội bộ ngắn, hoặc wrapper quanh input của thư viện mà bạn cần focus thật.

### 4. Chọn đường nào — bảng quyết định

Bảng dưới là bản đồ chọn đường: đọc cột "Tình huống", tìm dòng giống case của bạn nhất, rồi đi theo cột "Đường đi".

| Tình huống | Đường đi | Vì sao |
|---|---|---|
| Hành vi gắn với điều kiện (focus khi lỗi, reset khi submit) | Props/state + effect (mục 1) | Đúng mô hình một chiều, dễ test, dễ đọc |
| Component dùng chung, cần kích hoạt tự do (focus, clear, scroll tới) | `useImperativeHandle` (mục 2) | Con chủ động chọn lộ gì, cha không biết ruột gan con |
| Component nội bộ, cần chạm DOM thật gấp | Truyền ref xuống (mục 3) | Nhanh, nhưng chỉ dùng trong nhà |
| Cha gọi method con mọi lúc, mọi component | Sai đường | Tách logic ra custom hook thay vì "gọi" con |

### 5. Quy tắc "thực chiến" (nên nói với interviewer)

1. **Mặc định: props/event** — focus khi lỗi, reset khi submit đều viết được bằng props, không cần "gọi".
2. **Ngoại lệ: API công khai** — component bán cho người khác dùng (thư viện) thì lộ 1–2 method qua `useImperativeHandle`.
3. **Cực chẳng đã: ref DOM trần** — chỉ trong nội bộ, khi thật cần focus/scroll/đo.
4. **Tuyệt đối không**: cha gọi mọi method của con — đó là dấu hiệu logic đặt sai chỗ, tách ra custom hook.

> **Tóm gọn 1 câu:** Con như nhân viên nhận công văn (props) chứ không nhận điện thoại riêng (method) — chỉ khi việc không tả được bằng công văn mới phát cho hắn một đường dây nóng (`useImperativeHandle`).

## Bẫy khi phỏng vấn

1. **"Cứ cần là dùng ref để 'gọi' method con"** → **sai**: ref là "đường dự phòng", không phải mô hình chính. Thứ tự đúng: **props/state** (viết được thì dùng) → `useImperativeHandle` (hàng dùng chung) → truyền ref (nội bộ, cần DOM thật).
2. **"React 19 vẫn phải `forwardRef` mới nhận được ref"** → **sai**: 19 cho `ref` thành prop thường, function component nhận trực tiếp. `forwardRef` chỉ còn cho code cũ.
3. **Dùng `useImperativeHandle` mà "deps" sai** (trống `[]` nhưng "dùng" state đổi) → handle "trễ" (gọi "cũ"). Fix: "đúng" deps (hoặc không "dùng" state).
4. **"Truyền ref DOM xuống con" mà "không kiểm tra null"** (`ref.current.focus()` khi chưa mount) → **sai** (null). Fix: `?.` hoặc "đọc" trong effect (Q10).
5. **"Cha 'gọi' con mỗi render"** (ví dụ "render" mà "gọi" `searchRef.current?.focus()` trong body) → **sai** (side-effect trong render, StrictMode "lộ" — Q3). "Gọi" trong **event handler / effect**, không "render".

## Gợi ý câu chốt

> "Mặc định của React là **data xuống (props), sự kiện lên (callback)**. Muốn con focus khi lỗi thì truyền prop `error`, con tự focus trong effect — không cần gọi method. Chỉ khi hành vi không gắn được với state (focus tự do, clear từ toolbar ngoài) mới dùng `useImperativeHandle` để con lộ đúng 1–2 method, cha gọi qua ref. Truyền ref DOM trần thì nhanh nhưng chỉ dùng trong nội bộ."

## Reference

- [`3_react-tutorial/4-ref-template-variable`](../../3_react-tutorial/4-ref-template-variable) — `useImperativeHandle`, callback ref
- [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction) — mô hình props/callback một chiều
- Q1 (Library vs Framework) — vì sao React không cho cha trỏ thẳng vào con như gọi hàm thường
- Q2 (React 18 vs 19) — `ref` là prop (bỏ `forwardRef`)
- Q10 (`useRef` vs `useState`) — "đọc ref an toàn" (effect/event, không "render")

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q10 — useRef làm gì?](../10-useref-vs-usestate/README.md) · [Q34 — ref callback cho N phần tử?](../34-ref-callback-n-items/README.md)
- **Đào sâu (xuyên nhóm)**: [Q17 — controlled form (con tự focus khi submit sai)?](../17-controlled-form/README.md)
