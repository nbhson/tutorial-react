# Q11: Cha muốn gọi một hành vi của con (vd focus input trong con) thì làm sao?

## Câu hỏi

> Component con có một input, và cha muốn gọi hành vi của con (focus input đó, reset form con...) thì React làm thế nào?
> Có cách gọi kiểu Angular (gọi method public qua @ViewChild) không, và khác gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- React **không khuyến khích** cha gọi trực tiếp method con — triết lý là **dữ liệu chảy xuống (props), sự kiện chảy lên (callback)** (unidirectional). Gọi method con là **escape hatch** (hàm "imperative").
- 3 cách, từ "ít cần" đến "nặng":
  1. **Ưu tiên: đẩy logic lên state** — đổi hành vi bằng props/state thay vì gọi method (ví dụ muốn input con focus? truyền prop `focusOn`/`key` thay cho "gọi" method). Đây là cách "React-y" nhất.
  2. **`useImperativeHandle`** — con **lộ API có kiểm soát** (chỉ vài method, ví dụ `focus`, `clear`) cho cha qua ref. Tương đương gọi method public của Angular component, nhưng **chủ động chọn lộ gì** (không lộ toàn bộ DOM).
  3. **Ref vào DOM trực tiếp** (cha truyền ref xuống, con gắn vào input) — nhanh nhưng lộ **toàn bộ DOM node** (thiếu kiểm soát), ít "an toàn" hơn.

## Trả lời chi tiết

### 1. Vì sao "gọi method con" không phải mô hình React

React là **unidirectional**: con không "biết" ai là cha, chỉ nhận props. Nếu cha "gọi" con liên tục (imperative), bạn quay về kiểu **cặp component "vướng víu"** — khó test, khó tái sử dụng, và "đồng bộ state" trở nên mơ hồ (ai giữ sự thật?).

**Nguyên tắc**: trước khi dùng imperative, tự hỏi **"hành vi này có biểu diễn được bằng state/props không?"**

- Muốn con "focus input khi lỗi" → truyền prop `error` (con tự effect: `if (error) ref.current?.focus()`).
- Muốn con "reset" → truyền prop `resetToken` (hoặc dùng **`key`** để ép unmount/mount sạch — xem [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction)).

### 2. `useImperativeHandle` — "lộ API có kiểm soát" (đáp án chuẩn)

```tsx
// Con (Search) chỉ LỘ focus + clear, không lộ toàn bộ input DOM:
import { useImperativeHandle, useRef, useState } from "react";

export type SearchHandle = { focus: () => void; clear: () => void };

function Search({ ref }: { ref?: React.Ref<SearchHandle> }) {
  const inner = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inner.current?.focus(),
      clear: () => setQ(""),
    }),
    [] // deps — handle tạo lại khi deps đổi
  );
  return <input ref={inner} value={q} onChange={(e) => setQ(e.target.value)} />;
}

// Cha gọi:
function Parent() {
  const searchRef = useRef<SearchHandle>(null);
  return (
    <>
      <Search ref={searchRef} />
      <button onClick={() => searchRef.current?.focus()}>Tìm</button>
    </>
  );
}
```

Điểm mấu chốt (nói "ăn điểm" với interviewer):
- **React 19**: `ref` là **prop thường** (bỏ `forwardRef` — xem [`02-react-18-vs-19`](../02-react-18-vs-19/README.md)) — function component nhận `ref` như props bình thường.
- **Con không "đọc" `key` (React tiêu thụ key cho diff — Q8); `ref` là kênh riêng** — con "lộ" API qua `useImperativeHandle`, cha nhận handle qua ref.
- **Lộ ít, kiểm soát nhiều**: con chọn chính xác method nào "ra ngoài" — khác với "truyền ref DOM" (lộ toàn bộ node).

### 3. "Truyền ref xuống, con gắn vào input" (nhanh nhưng thô)

```tsx
// Con "nhận" ref của cha và "gắn" vào input DOM:
function Search({ inputRef }: { inputRef: React.Ref<HTMLInputElement> }) {
  return <input ref={inputRef} />;
}
// Cha: const r = useRef<HTMLInputElement>(null); r.current?.focus();
```

- **Ưu điểm**: không cần `useImperativeHandle`, type đơn giản.
- **Nhược điểm**: cha **biết con có input** (vướng víu nội bộ), mất "kín" (con đổi implementation DOM → cha "sai" ref type).
- **Khi nào dùng**: component "ngắn", hoặc con "nặng" và bạn cần focus thật (thư viện input wrapper).

### 4. So sánh Angular (điểm "ăn điểm")

| React | Angular | Ghi chú |
|---|---|---|
| `useImperativeHandle(ref, () => ({ focus, clear }))` | Component "public method" (`searchFocus()`) + `@ViewChild(SearchComponent)` | Angular **tự lộ** mọi method public; React **chủ động chọn** (kín hơn) |
| `ref` (prop thường, React 19) | `ViewChild` | Cùng "trỏ" con, nhưng React "giới hạn" qua handle |
| Truyền ref DOM xuống con | `@ViewChild` + `ElementRef` (query DOM cụ thể) | Cùng "lộ" DOM (thô), nhưng Angular "có sẵn" (DI), React "tự ghép" |
| Ép reset bằng `key` | `ngDestroy` + recreate (hoặc signal reset) | React "ép" unmount/mount "sạch" (xem Q lifting state) |

> Điểm khác **cơ bản**: Angular là **framework** (có DI, query view "sẵn") — React là **library** (self-contained, bạn "ghép" qua ref/handle). "Kín" (encapsulation) của React = "chủ động chọn" API (xem [`01-library-vs-framework`](../01-library-vs-framework/README.md)).

### 5. Quy tắc "thực chiến" (nên nói với interviewer)

1. **Trước: "có state/props không?"** — nếu "được" (focus khi lỗi, reset) → dùng **props/effect**, không "gọi" (sạch nhất, "React-y").
2. **Sau: "API công khai (public) cần lộ"** — ví dụ "thư viện" (component bạn "bán" cho người khác) → `useImperativeHandle` (chỉ lộ "cần").
3. **Cực: "DOM cụ thể (focus/scroll/measure) trong con"** — truyền ref (hoặc con "tự" `useRef` + "báo" cha qua callback — "tránh" lộ).
4. **Không: "lộ toàn bộ instance con (cha gọi mọi method)"** — "vi phạm" encapsulation; nên "tách" logic (custom hook) thay vì "gọi" con.

## Bẫy khi phỏng vấn

1. **"Mọi lúc dùng ref để 'gọi' method con"** (nói suông) → **sai**: ref là "escape hatch", không phải "mô hình". Ưu tiên **state/props** (nếu "được"), `useImperativeHandle` (nếu "cần"), truyền ref (nếu "thật cần DOM").
2. **Nhầm "React = Angular (gọi method công khai)"** → **sai ở "mặc định"**: Angular "mặc định" lộ method public (kín "thô"); React "mặc định" kín (phải "chủ động" lộ qua handle) — "điểm khác cơ bản".
3. **Dùng `useImperativeHandle` mà "deps" sai** (trống `[]` nhưng "dùng" state đổi) → handle "trễ" (gọi "cũ"). Fix: "đúng" deps (hoặc không "dùng" state).
4. **"Truyền ref DOM xuống con" mà "không kiểm tra null"** (`ref.current.focus()` khi chưa mount) → **sai** (null). Fix: `?.` hoặc "đọc" trong effect (Q10).
5. **"Cha 'gọi' con mỗi render"** (ví dụ "render" mà "gọi" `searchRef.current?.focus()` trong body) → **sai** (side-effect trong render, StrictMode "lộ" — Q3). "Gọi" trong **event handler / effect**, không "render".

## Gợi ý câu chốt

> "React 'không khuyến khích' cha 'gọi' method con — 'mặc định' là 'dữ liệu xuống (props), sự kiện lên (callback)'. Nếu 'thật cần' imperative: (1) 'ưu tiên' state/props (focus khi lỗi = prop `error` + effect); (2) 'lộ API' (thư viện/component công khai) = `useImperativeHandle` (con 'chọn' lộ gì, không 'lộ' DOM 'toàn bộ'); (3) 'cực' = truyền ref (DOM cụ thể, nhưng 'thô'). Đây là 'điểm khác cơ bản' với Angular: Angular 'mặc định' lộ method public (kín 'thô'), React 'mặc định' kín (phải 'chủ động' handle) — 'vì React là library, không framework (Q1).'"

## Reference

- [`3_react-tutorial/4-ref-template-variable`](../../3_react-tutorial/4-ref-template-variable) — `useImperativeHandle`, callback ref, bảng so Angular
- [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction) — "mặc định" props/callback (unidirectional)
- Q1 (Library vs Framework) — "vì sao React 'không có' query view 'sẵn' (không DI)"
- Q2 (React 18 vs 19) — `ref` là prop (bỏ `forwardRef`)
- Q10 (`useRef` vs `useState`) — "đọc ref an toàn" (effect/event, không "render")

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q10 — useRef làm gì?](../10-useref-vs-usestate/README.md) · [Q34 — ref callback cho N phần tử?](../34-ref-callback-n-items/README.md)
- **Đào sâu (xuyên nhóm)**: [Q17 — controlled form (con tự focus khi submit sai)?](../17-controlled-form/README.md)
