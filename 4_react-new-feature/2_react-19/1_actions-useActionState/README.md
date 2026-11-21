# 1. Actions & useActionState

## Mô tả
- Bài này giới thiệu **Actions** — cơ chế form/mutation mới của React 19 (ra mắt **12/2024**, **status: stable**).
- React 19 cho phép truyền **async function (action)** thẳng vào `<form action={...}>`; cùng với hook **`useActionState`** quản lý trọn vòng đời: `state` (kết quả), `formAction`, `isPending`.
- Bổ trợ quan trọng: `useFormStatus()` (trong `react-dom`) để đọc pending của form cha mà không cần prop drilling.

## Mục tiêu
- Viết form mutation với `action` + `useActionState`, bỏ <code>onSubmit</code> + `preventDefault` + `useState` thủ công.
- Hiểu 3 giá trị trả về và cách React tự set `isPending` quanh action async.
- Kết hợp `useFormStatus` cho nút submit nằm sâu trong form.

## Vấn đề giải quyết

Mục này kể về mớ bòng bong của form trước 19: mỗi form một bộ `preventDefault` + vài `useState` riêng. Đọc để hiểu Actions dọn đống lặp code đó thế nào.

- Trước đây mỗi form cần: `onSubmit={e => { e.preventDefault(); ... }}` + `useState` cho pending/error/result + `try/catch`; dễ **quên reset pending khi lỗi**, dễ lặp code ở mọi form. Ví von: như mỗi lần nấu ăn phải tự dựng bếp riêng — Actions là bếp được dựng sẵn trong nhà.
- Actions chuẩn hóa: React tự **bọc pending quanh vòng đời action**, cho phép progressive enhancement — khi JS chưa load/hydrate, form vẫn có thể submit theo kiểu HTML/server action (cần framework như Next.js).
- `useActionState` thay thế pattern "state object + setState sau fetch" bằng một API khai báo: hàm action nhận `prevState` + `formData` và trả `nextState`.

## Khái niệm cốt lõi

Mục này là phần giải phẫu của Actions: một action là gì, `useActionState` trả về 3 thứ gì, và `useFormStatus` giải bài toán "nút submit nằm sâu". Hãy hình dung `useActionState` như quầy thu ngân có sẵn máy in hóa đơn: bạn đưa "quy trình xử lý" (action), quầy lo phần còn lại — bật đèn "đang xử lý" (`isPending`), in kết quả (`state`), và đưa bạn đúng nút bấm (`formAction`).

- **Action** = một async function được truyền vào `action` prop của `<form>` (hoặc bọc promise-based). React gọi nó khi submit, và **với hỗ trợ framework** còn serialize `FormData` lên server route (Server Actions) để chạy cả khi JS chưa hydrate.
- **`useActionState(action, initialState)`** trả về `[state, formAction, isPending]`:
  - `state` — giá trị kết quả; khởi đầu là `initialState`, về sau là thứ action trả về.
  - `formAction` — hàm truyền vào `<form action={formAction}>`; React gọi action với `(prevState, formData)` và tự quản pending.
  - `isPending` — `true` từ lúc submit tới khi Promise resolve → disable nút, hiện spinner.
  - Action nhận **`prevState`** làm tham số đầu — không đọc `state` cũ trực tiếp; nếu muốn payload ngoài form (ví dụ `postId`), dùng `formData` hoặc closure đã truyền.
- **`useFormStatus()`** (chỉ chạy trong component con của `<form>`): trả `{ pending, data, method, action }` — nút submit nằm sâu bao tầng cũng biết pending của form cha mà không cần truyền prop.
- **Identity ổn định**: `formAction` nên giữ ổn định (không tạo trong render); nếu deps đổi, React xử lý qua lại — nhưng tránh tạo action mới vô nghĩa mỗi render khi có thể.

> **Tóm gọn 1 câu:** Actions là "trọn gói form": bạn nộp hàm async, React nộp lại state + nút submit + đèn pending — hết thời tự tay bưng bít từng món.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

Note: tên cũ ở canary là **`useFormState`** — từ 19 stable dùng `useActionState`.

## Luồng hoạt động (Flow)

Mục này đi theo một lượt submit từ đầu tới cuối: action được gọi, pending bật, kết quả hoặc lỗi trở về state.

1. User submit `<form action={formAction}>` → React gọi action `(prevState, formData)`.
2. React set `isPending = true` → nút disabled, có thể render spinner.
3. Async action chạy (fetch, validate, ghi DB...); nếu throw → React **ngầm bắt** và set `isPending = false`, `state` giữ nguyên (lỗi do bạn tự trả trong state).
4. ActionResult → React set `state = nextState`, `isPending = false` → UI cập nhật.

> **Tóm gọn 1 câu:** Submit là mở "quy trình trọn gói": pending tự bật/tắt, lỗi không ném ra ngoài mà trả về trong state, kết quả thành công cũng vậy.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `State = { ok, message }` — shape tối giản để action trả kết quả; có thể mở rộng `{ errors: {...} }` cho form nhiều field.
- `updateName(prev, formData)` — tham số thứ hai luôn là `FormData`; field lấy qua `formData.get('name')` **khớp với `name` attribute** của input.
- Không `try/catch` trong action để báo lỗi: trả về state lỗi là *convention* — pending tự tắt, UI hiện message mà không ném exception vào Error Boundary.
- `disabled={isPending}` — chặn submit kép; `useFormStatus` có thể thay thế ở con của form khi nút nằm trong component khác.
- `initialState` render trước khi hành động nào xảy ra — "trống".

## So sánh với cách làm cũ

Bảng dưới đặt form kiểu 17/18 cạnh form kiểu 19. Đọc theo hàng: mỗi dòng là một việc bạn từng làm tay và giờ được gói lại.

| Cách cũ (React 17/18) | Cách mới (React 19) | Lợi ích |
|---|---|---|
| `onSubmit` + `preventDefault` + gọi API thủ công | `<form action={fn}>` | Khai báo, ít boilerplate |
| `useState` pending + `useState` error + result | `useActionState` trả `[state, formAction, isPending]` | Một nguồn truth, tự reset pending |
| Truyền `isPending`/`onSubmit` xuống component con | Nút dùng `useFormStatus` | Không prop drilling |
| Không chạy khi JS chưa load | Progressive enhancement qua server action (framework) | Form dùng được ngay cả chưa hydrate |

> **Cách đọc bảng này:** đọc từng hàng như một "trước – sau"; hàng cuối là khác biệt lớn nhất vì nó không phải gọn code mà là khả năng hoạt động cả khi JS chưa tải.

## Lỗi thường gặp

Mục này gom 5 bẫy phổ biến của Actions — nổi bật nhất là ném lỗi để báo lỗi form (số 3) và dùng sai tên hook cũ (số 4).
1. **Quên tham số `prevState` trong signature action** → vì sao: React luôn gọi `(prevState, formData)`; viết sai làm formData rơi vào vị trí state → fix: đúng hai tham số.
2. **Mutable `prevState`** (ví dụ `prev.items.push(...)`) → vì sao: vi phạm immutability, re-render không đúng → fix: trả mảng/object mới (`[...prev.items, x]`).
3. **Ném lỗi (throw) để báo lỗi form** → vì sao: throw sẽ bị React bắt ở tầng khác, không render được message trong form → fix: trả `{ ok: false, message }` trong state; chỉ throw khi muốn Error Boundary.
4. **Vẫn dùng `useFormState` (tên cũ)** → vì sao: 19 stable đổi tên → fix: đổi sang `useActionState`.
5. **`useFormStatus` gọi ngoài `<form>`** → vì sao: cần context của form cha để đọc pending → fix: đặt trong component con của form (ví dụ nút submit).

> **Tóm gọn 1 câu:** Hãy nhớ "action nhận (prevState, formData), trả state chứ không throw, và `useFormStatus` chỉ sống trong nhà form".

## Khi nào dùng / Khi nào không
- **Dùng**: mọi form mutation phía client (login, tạo todo, checkout), form cần pending/error/result tập trung, nút submit nằm sâu trong form (kết hợp `useFormStatus`), form muốn chạy cả khi JS chưa load (cần Server Actions + framework).
- **Không dùng**: logic không phải form (fetch tùy ý trong effect — đó vẫn là `useEffect`), hoặc khi cần kiểu soạn thảo form phức tạp có validation theo từng field riêng (kết hợp thư viện form + `useActionState` cho submit).

## Bài tập nhỏ

Bài tập kiểm chứng hai thứ: form hoạt động đúng và chặn submit kép — hai tình huống thực tế nhất của mọi form mutation.

- Viết form "Thêm todo": `useActionState` với `initialState = { ok: false, message: '' }`, action kiểm tra title rỗng (lỗi nếu trống), thành công trả thông báo; thêm nút submit con dùng `useFormStatus` để đổi label "Đang tạo..." và disabled. Kiểm tra: submit nhanh 2 lần → chỉ 1 action chạy.

> **Tóm gọn 1 câu:** Nếu submit kép bị chặn và lỗi rỗng hiện đúng chỗ, bạn đã dùng đúng trọn bộ Actions.

## Reference
- [React 19 Release — Actions](https://react.dev/blog/2024/12/05/react-19#actions)
- [useActionState](https://react.dev/reference/react/useActionState)
- [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [<form> reference](https://react.dev/reference/react-dom/components/form)