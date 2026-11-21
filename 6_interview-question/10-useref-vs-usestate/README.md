# Q10: Cần giữ một giá trị qua các lần render mà không muốn UI render lại, em dùng gì?

## Câu hỏi

> Mình cần giữ một giá trị (ví dụ id của timer, tham chiếu input) mà đổi nó không được làm UI re-render — dùng gì, và khác `useState` ở chỗ nào?
> Đổi `ref.current` không re-render thật không, vì sao?
> So với Angular thì tương đương với gì (`@ViewChild`, `Signal`)?

## Trả lời ngắn (elevator pitch, 30 giây)
- `useRef` là cái "hộp" giữ đồ qua các lần vẽ: đổi đồ trong hộp **không làm vẽ lại**. Dùng cho tham chiếu DOM, id của timer, cờ nội bộ.
- `useState` là "giá trị lên hình": gọi set là **vẽ lại**. Dùng cho thứ hiện lên màn hình.
- Một câu phân loại: "giá trị này có hiện lên UI không?" Có → `useState`, không → `useRef`. Đọc ref an toàn trong event/effect, đừng đọc trong lúc render.

## Trả lời chi tiết

### 1. `useRef` trả về gì, hành vi chính xác

> 📄 **Code ví dụ:** [`examples/01-1-useref-tra-ve-gi-hanh-vi-chinh.tsx`](examples/01-1-useref-tra-ve-gi-hanh-vi-chinh.tsx)

3 tính chất "ăn điểm" nếu nói đúng:

| Tính chất | Ý nghĩa |
|---|---|
| **Tạo 1 lần, ổn định qua mọi render** | object `{ current }` là **cùng một** mỗi lần render (đặc biệt quan trọng với StrictMode double-render — xem [`03-strictmode`](../03-strictmode/README.md)) |
| **`ref.current = x` không trigger render** | React không "wrap" setter — khác `setState` hoàn toàn |
| **Đọc trong render là DANG HAY SAI** | `ref.current` lúc render có thể là `null` (chưa mount) hoặc **giá trị cũ** (render "bắt trước" commit). Đọc an toàn ở **effect/event handler** (sau commit) |

### 2. `useState` vs `useRef` — bảng "một trang"

| Tiêu chí | `useState` | `useRef` |
|---|---|---|
| Giá trị trả về | `[value, setValue]` (value là "giá trị" thuần) | `{ current }` (object) |
| Đổi giá trị có re-render? | **Có** (`setState` schedule render) | **Không** |
| Khi nào dùng | Dữ liệu **cần hiển thị / thay đổi giao diện** | Tham chiếu DOM, timer id, "giữ" mutable không vẽ |
| Initial value | Truyền trực tiếp (hỗ trợ lazy `useState(() => expensive())`) | Truyền trực tiếp (chạy **mỗi render** nếu là object — nên tránh truyền object tạo mới, xem §4 bẫy) |
| Angular (đối chiếu) | `@State` (Signal) / `subject` + template | `#box` + `@ViewChild("box")` + `ElementRef` |

> **Cách đọc bảng này:** mỗi dòng là một tiêu chí, đọc ngang để so `useState` (cột giữa) với `useRef` (cột phải) — dòng "Đổi giá trị có re-render?" là dòng phân biệt nhất, nhớ được dòng này là trả lời được nửa câu hỏi.

### 3. Vì sao React "không tự re-render khi ref đổi" (nói được "tại sao")

Re-render chỉ chạy khi React **biết** có gì đổi — và React "biết" qua **hai kênh**:

1. **`setState`** (con gọi, React "được báo" → schedule).
2. **Props từ cha đổi / context value đổi / store notify** (cha "tới" render → con render theo).

`ref.current = x` **không nằm trong 2 kênh đó** — đó là **viết thẳng vào object của bạn**, React không can thiệp. Đây chính là điểm **mạnh** (không tốn render) và **nguy hiểm** (UI có thể "trễ" so với ref):

> 📄 **Code ví dụ:** [`examples/02-3-vi-sao-react-khong-tu-re-render.tsx`](examples/02-3-vi-sao-react-khong-tu-re-render.tsx)

> **Quy tắc thực chiến**: **value cần "hiển thị" → state; cần "im lặng" (không trigger render) → ref**. Nếu bạn muốn "đổi cả ref lẫn UI" → **đồng thời** gọi `setState` + cập nhật `ref.current` (hoặc chỉ dùng state, ref là "shadow" của state).

### 4. 3 "trường hợp chuẩn" dùng `useRef` (điểm "ăn điểm" nhất)

> 📄 **Code ví dụ:** [`examples/03-4-3-truong-hop-chuan-dung-useref-iem.tsx`](examples/03-4-3-truong-hop-chuan-dung-useref-iem.tsx)

### 5. Một bẫy khác hay gặp (nếu bị hỏi tiếp)

**"Initial value của `useRef` có chạy mỗi render không?"**

> 📄 **Code ví dụ:** [`examples/04-5-mot-bay-khac-hay-gap-neu-bi.tsx`](examples/04-5-mot-bay-khac-hay-gap-neu-bi.tsx)

So với `useState`: **`useState(() => x)` là lazy — chỉ chạy LẦN ĐẦU** (React nhớ "đã có state"). `useRef` **không lazy**: đối số "chạy" mỗi render nhưng "thừa" (bị bỏ qua). Kết quả: **khởi tạo ref "đắt" phải làm thủ công** (`if` guard hoặc `useEffect`), không "tin" là "chạy 1 lần".

### 6. Đối chiếu Angular (điểm "ăn điểm" cho người từ Angular)

| Angular | React (`useRef`) | Ghi chú |
|---|---|---|
| `#box` (template variable) + `@ViewChild("box")` | `useRef<HTMLDivElement>(null)` + `<div ref={boxRef}/>` | Cùng "trỏ" vào view child |
| `ElementRef.nativeElement` | `ref.current` (luôn kiểm tra `null`, dùng `?.`) | DOM node thật, không "bọc thêm" |
| Đọc DOM trong `ngAfterViewInit` (sau mount) | Đọc trong `useEffect`/`useLayoutEffect` | Cùng "sau commit" |
| `@ViewChildren` (list) | callback ref giữ `Set`/`Map` | React "không có" query list "sẵn" — "tự gom" |
| Signal (mutable + reactivity) | **Không có tương đương "tinh tế"** — `useRef` là "mutable, không reactive" (chưa có "Signal" trong React core) | "Điểm khác cơ bản" (Signal là "mutable + notify", ref là "mutable + im lặng") |

> **Cách đọc bảng này:** cột Angular là thứ bạn đã quen, cột React là thứ cần chuyển sang — đọc ngang từng dòng để tìm "tương đương"; dòng cuối (Signal) là dòng khác căn bản nhất, nên dành thời gian nhất cho nó.

> **Tóm gọn 1 câu:** `useRef` là chiếc hộp im lặng đi theo component qua mọi lần vẽ, `useState` là thứ lên hình — cần hiện lên màn hình thì để state, cần im lặng thì nhét vào hộp.

## Bẫy khi phỏng vấn

1. **"Ref 'giữ state' (vì 'ref = state không re-render')"** (nói suông) → **sai ở "ý nghĩa"**: ref **không "giữ state" UI** (UI "trễ" nếu bạn chỉ đổi ref). Ref là **"hộp" mutable + ổn định**, không phải "nguồn sự thật" (state mới là "nguồn sự thật").
2. **"Đọc `ref.current` trong render (để tính giá trị hiển thị)"** → **DANG** (giá trị "cũ" / `null` lần đầu). Fix: đọc trong **effect/event** (sau commit) hoặc **state**.
3. **Nhầm "ref = state cho DOM"** (dùng ref giữ `count` rồi hi vọng UI "đổi") → **sai** (UI "trễ"). Nếu "cần UI đổi" → **state**.
4. **"Initial value object/mảng tạo mới mỗi render"** → **DANG** (React "không giữ" object "tạo mới" — nên "tránh" truyền object "tạo mới" làm initial). Fix: `useRef(null)` + khởi tạo trong `useEffect`.
5. **"Ref 'giữ giá trị cũ' khi component unmount rồi remount"** → **đúng** (ref "giữ" "lần đầu" "mỗi lần mount", không "reset" khi re-render; nhưng "bị" unmount thì "tạo mới" — nên "không" dùng ref "giữ" "dữ liệu xuyên unmount", đó là **work của Context/store** (không phải ref)).

## Gợi ý câu chốt

> "`useRef` là 'hộp' (object `{ current }`) tạo **một lần** lúc mount, **cùng một object** dùng lại qua mọi render; đổi `ref.current` **không re-render** (React không 'nghe' gì). `useState` thì đổi **kích hoạt** render (đánh dấu dirty, schedule). Quy tắc phân loại: **giá trị cần 'hiển thị' → `useState`; giá trị 'im lặng' (DOM ref, timer id, 'giữa các lần render') → `useRef`**. Đọc `ref.current` an toàn ở **effect/event** (sau commit), không đọc trong render (giá trị 'cũ' / `null`). Đây là điểm **khác cơ bản** với Angular: Angular có `@ViewChild`/Signal (mutable + reactive); React ref là 'mutable + im lặng' (chưa có Signal trong core)."

## Reference

- [`3_react-tutorial/4-ref-template-variable`](../../3_react-tutorial/4-ref-template-variable) — `useRef` = `#template` + `@ViewChild`, callback ref, `useImperativeHandle`
- [`3_react-tutorial/15-lifecycle-effects`](../../3_react-tutorial/15-lifecycle-effects) — đọc ref "an toàn" (sau mount/commit)
- [`3_react-tutorial/16-custom-hooks`](../../3_react-tutorial/16-custom-hooks) — `usePrevious` (giữ giá trị giữa render)
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — khi "cần dữ liệu 'xuyên unmount'" (ref "không" "giữ" được)
- Q3 (StrictMode) — vì sao `useRef` "ổn định" "quan trọng" (double-invoke)
- Q5 (Virtual DOM) — "render không 'biết' 'thay đổi DOM tay' (ref 'sai' DOM)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q11 — cha muốn gọi hành vi của con (focus input)?](../11-parent-calls-child-method/README.md) · [Q34 — giữ ref cho N phần tử động?](../34-ref-callback-n-items/README.md)
- **Đào sâu (xuyên nhóm)**: [Q25 — vì sao không gọi hook trong if/for?](../25-rules-of-hooks/README.md) · [Q26 — setState 2 lần, render mấy lần?](../26-batching-stale-closure/README.md)
