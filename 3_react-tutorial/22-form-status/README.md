# DAY 22: FORM STATUS & ACTIONS (`useFormStatus` + `useActionState`)

## Mục tiêu bài học
- Kết hợp **`useActionState`** (state trả về từ action) và **`useFormStatus`** (đọc trạng thái form cha) — bộ đôi chuẩn React 19 cho form, theo đúng docs react.dev.
- Hiểu ranh giới: `useFormStatus` **phải nằm trong component con** của `<form>`, không đọc được từ component chứa form.
- Thay được phần "loading state + disable nút + hiện lỗi" viết tay trước đây bằng cơ chế built-in, đồng thời giữ thói quen validate bằng Zod.

## Khái niệm cốt lõi (Core)

### 1. `<form action={fn}>` — submit gọi hàm, không tự viết `onSubmit`
React 19 cho truyền **hàm** vào prop `action` của `<form>`: khi submit, React gọi hàm với `FormData`. Không cần `e.preventDefault()` — form **không reload** mặc định khi `action` là function. Trong Next.js App Router, hàm có thể là **Server Action** (`"use server"`); trong Vite/thuần React, nó là hàm client async.

```tsx
//Thuần React (client): action nhận FormData, async OK
async function submit(fd: FormData) {
  await saveName(String(fd.get("name")));
}
<form action={submit}>...</form>
// Không cần onSubmit + preventDefault — React lo
```

Vì sao đáng đổi? Vì luồng submit async có sẵn: React biết form "đang gửi" (pending) và cho hook đọc trạng thái đó — thay vì tự viết `isSubmitting` như RHF/DAY 11.

### 2. `useActionState` — state trả về từ action
`const [state, action, pending] = useActionState(fn, initial)`:

- `state` — giá trị trả về của lần gọi action **gần nhất** (ví dụ `{ errors }`); giữa chừng là `initial`.
- `action` — hàm truyền thẳng vào `<form action={action}>`; có dạng `(prevState, formData) => newState` (signature khác hàm action thường: thêm `prevState`).
- `pending` — `true` khi action đang chạy (thay `isSubmitting` tự viết).

```tsx
type State = { errors: string[] | null };
const [state, action, pending] = useActionState(async (_prev: State, fd: FormData) => {
  const body = String(fd.get("body") ?? "");
  if (body.length < 3) return { errors: ["Ít nhất 3 ký tự"] };
  await api.addComment(body);       // lỗi ném ra => React giữ prev state? KHÔNG — throw là crash boundary
  return { errors: null };          // validation error = state, KHÔNG throw
}, { errors: null });

<form action={action}>
  <textarea name="body" />
  {state.errors && <p role="alert">{state.errors[0]}</p>}
</form>
```

Vì sao validation error phải **trả về state** chứ không throw? Vì throw trong action đi vào Error Boundary (trang "Oops") — đó là lỗi hệ thống. Lỗi validate là *kết quả dự kiến* → nằm trong state, hiện cạnh field. Đây là quy ước react.dev: **action trả dữ liệu, không ném lỗi nghiệp vụ**.

### 3. `useFormStatus` — nút đọc form cha, không prop drilling
`const { pending, data, method } = useFormStatus()`: hook đọc trạng thái của `<form>` **cha gần nhất**. Quy tắc sống còn: **component gọi `useFormStatus` phải là con của `<form>`** — gọi trong component chứa form thì trả `pending: false` mãi mãi (không có form cha phía trên hook đó).

```tsx
// SubmitButton.tsx — KHÔNG nhận prop pending, tự đọc form cha
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Đang lưu..." : children}</button>;
}

<form action={action}>
  <textarea name="body" />
  <SubmitButton>Đăng</SubmitButton>  {/* con trực tiếp => đọc được pending */}
</form>
```

Vì sao thiết kế kiểu này? Vì nút submit thường là component tái sử dụng (Nút UI dùng chung 20 form) — không muốn mỗi chỗ truyền prop `pending`. React 19 bọc form trong Context ẩn; `useFormStatus` là cách đọc đúng không cần tự bọc Context.

### 4. Bộ đôi kết hợp — pattern chuẩn
`useActionState` lo **kết quả** (errors, thành công), `useFormStatus` lo **trạng thái lúc gửi** (disable nút, đổi chữ). Form dùng cả hai:

```tsx
"use client";
const [state, action, pending] = useActionState(addComment, { errors: null, ok: false });

<form action={action}>
  <textarea name="body" />            {/* uncontrolled: gõ 0 re-render (DAY 22 khác DAY 11 controlled) */}
  {state.errors?.map((e) => <p key={e} role="alert">{e}</p>)}
  <SubmitButton>Đăng bình luận</SubmitButton>  {/* useFormStatus bên trong */}
</form>
```

Điểm tinh tế: `pending` từ `useActionState` **cũng đọc được** — vậy khi nào cần `useFormStatus`? Khi nút nằm ở **component con riêng** (tái sử dụng / ở xa trong cây). Nút cùng file với form thì dùng `pending` của `useActionState` là đủ. Đừng dùng cả hai cho cùng một nút — chọn một nguồn.

### 5. `useOptimistic` — hiện kết quả trước, server chốt sau
Với form thêm item vào list: `useOptimistic` hiện bản "kỳ vọng" ngay khi submit; server từ chối thì rollback tự động.

```tsx
const [optimisticComments, addOptimistic] = useOptimistic(comments, (cur, c: Comment) => [...cur, c]);
// trong action: addOptimistic(newComment) — chạy NGAY, không đợi await
// server reject => React trả list về như cũ; accept => replace bằng data thật
```

Không lạm dụng: chỉ cho thao tác "khả năng thành công cao, hậu quả sai thấp" (like, thêm comment). Xóa/linear-money-flow thì chờ server thật.

### 6. Đối chiếu Angular (người từ Angular sang)
- `form` submit + `NgForm.pending` ↔ `<form action>` + `useFormStatus().pending`.
- `submit` handler + state lỗi tự quản ↔ `useActionState` (state lỗi từ action).
- Template-driven với `[(ngModel)]` ↔ controlled input (DAY 11); Actions nghiêng về "uncontrolled + FormData" như `FormData` của Angular.

### Keyword chính
`useActionState` · `useFormStatus` · `useOptimistic` · `<form action>` · FormData · pending · Server Action · revalidatePath

## Luồng hoạt động (Flow)

1. User gõ vào `<textarea name="body">` — **uncontrolled**, React không re-render (khác controlled DAY 11).
2. Bấm nút `<SubmitButton>` (`type="submit"`) → React chặn reload mặc định, gọi `action(prevState, formData)`.
3. `useFormStatus().pending` của nút → `true` ngay (nút disable, chữ "Đang lưu...").
4. Action chạy: validate Zod / gọi API. Chưa xong thì form vẫn hiện value cũ (không "trắng").
5. Action **trả** `{ errors }` hoặc `{ ok: true }` → `useActionState` cập nhật `state` → form render lỗi cạnh field (hoặc hiện thông báo thành công).
6. `pending` → `false`, nút bật lại. Nếu thành công + `formRef.reset()` (gọi tay trong wrapper của action) → form sạch.
7. Trong Next.js: action là Server Action → chạy trên server; `revalidatePath` làm data mới vào lần render sau (không refetch tay ở client).

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Bản mô phỏng chạy được (không cần server):

```tsx
// Giả lập Server Action bằng hàm async client — signature giữ nguyên (prev, formData)
type State = { errors: string[] | null; ok: boolean };

async function addComment(_prev: State, fd: FormData): Promise<State> {
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 3) return { errors: ["Bình luận ít nhất 3 ký tự"], ok: false };
  if (body.length > 140) return { errors: ["Tối đa 140 ký tự"], ok: false };
  await fakeApi(body); // 800ms — thử bấm kép: nút đã disable
  return { errors: null, ok: true };
}

export default function CommentBox() {
  const [state, action, pending] = useActionState(addComment, { errors: null, ok: false });
  return (
    <form action={action}>
      <textarea name="body" placeholder="Viết bình luận..." aria-label="Bình luận" />
      {state.errors && state.errors.map((e) => <p key={e} role="alert">{e}</p>)}
      {state.ok && <p role="status">Đã đăng!</p>}
      <SubmitButton>Đăng</SubmitButton>
    </form>
  );
}

// SubmitButton — component con riêng, dùng useFormStatus (đây là lý do hook này tồn tại)
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Đang lưu..." : children}
    </button>
  );
}
```

## Giải thích từng phần

- **`action={action}`** — truyền hàm từ `useActionState` (chữ ký `(prev, formData) => state`). React tự `preventDefault`; không viết `onSubmit`.
- **`_prev`** — state lần trước (ở đây không dùng, nên đặt `_`); cần đếm số lần thử, tích lũy lỗi thì đọc `prev` thật.
- **`return` thay `throw`** — lỗi validate là dữ liệu; `throw` sẽ vào Error Boundary. Khác biệt "lỗi nghiệp vụ" vs "lỗi hệ thống" — bẫy phỏng vấn hay hỏi.
- **`useFormStatus` trong `SubmitButton`** — nút là component con riêng; không prop drilling. Nếu đặt hook trong `CommentBox` (component chứa form) sẽ luôn `pending: false` vì không có form cha phía trên.
- **`disabled={pending}`** — chống submit kép; form đang gửi thì bấm thêm không tạo request mới.
- **`role="alert"` / `role="status"`** — lỗi và thông báo thành công được screen reader đọc (a11y DAY 21/42).

## Bảng so sánh

| Tiêu chí | DAY 11 (controlled + RHF) | DAY 22 (Actions + useFormStatus) |
|---|---|---|
| Input | Controlled (`value`/`onChange`) hoặc RHF uncontrolled | **Uncontrolled** — đọc qua `FormData` |
| Re-render khi gõ | Controlled: mỗi phím; RHF: 0 | 0 |
| Validate | Zod ở client (resolver) | Zod ở **server** (hoặc client action) — 1 schema 2 nơi |
| Pending/loading | `isSubmitting` (RHF) / tự viết | `pending` từ `useActionState` hoặc `useFormStatus` |
| Reset form | `reset()` của RHF | `formRef.reset()` / React reset tự động sau action thành công |
| Nút disable | Truyền prop `isSubmitting` | `useFormStatus` — không cần prop |
| Khi nào | Form tương tác nặng, dynamic fields | CRUD/login/comment — mutation đơn giản |

## Lỗi thường gặp (Common pitfalls)

### 1. Gọi `useFormStatus` ở component chứa form
`pending` mãi `false` — hook chỉ đọc form **cha**. Fix: tách nút thành component con (hoặc dùng `pending` của `useActionState` ngay trong component form).

### 2. Throw lỗi validate trong action
Form sập vào Error Boundary thay vì hiện lỗi. Fix: `return { errors }` — lỗi nghiệp vụ là dữ liệu.

### 3. Quên `name` trên input
`FormData` trống (`fd.get("body") === null`) — uncontrolled đọc qua `name`, không qua `value`. Fix: mọi input cần `name` đúng chuỗi.

### 4. Truyền prop `pending` VÀ dùng `useFormStatus` cho cùng nút
Hai nguồn sự thật lệch nhau. Fix: chọn một — nút con riêng dùng `useFormStatus`; nút cùng file dùng `pending` của `useActionState`.

### 5. Reset form "vô điều kiện" trong action
`formRef.current?.reset()` chạy cả khi action thất bại ⇒ user mất chữ vừa gõ. Fix: chỉ reset khi state trả về báo thành công (kiểm tra trước khi reset).

### 6. Lẫn `formData` cũ khi submit kép
`pending` là chắn submit kép; nếu vẫn thấy request trùng (action bắn từ nhiều nơi), kiểm tra không có chỗ nào gọi `action(fd)` ngoài form.

## Best practices / Mẹo
- **Zod 1 nguồn**: schema dùng cho cả action và (nếu cần live check) phía client — `z.infer` làm type (Q35, DAY 11).
- **`role="alert"`** cho lỗi validate, `role="status"` cho thông báo thành công — a11y không tốn công.
- **Server Action luôn re-validate** — client là UX, server là an toàn (Q37).
- Không dùng `useOptimistic` cho thao tác hủy/tiền bạc — rollback không hoàn toàn "như chưa có gì".
- Test "bấm kép": bấm nút 3 lần nhanh → chỉ 1 request (nhờ `disabled={pending}`).

## Bài tập nhỏ
1. Nâng `example.tsx` thành form bình luận thật: thêm field `author`; lỗi từng field hiển thị cạnh field (mảng errors theo key thay vì mảng chuỗi).
2. Thêm `useOptimistic`: khi submit, bình luận hiện ngay (mờ 50% opacity) trước khi server chốt; server từ chối (body chứa "spam") thì bình luận biến mất.
3. Đổi `SubmitButton` thành component UI chung dùng ở 2 form khác nhau — chứng minh không cần truyền prop `pending`.
4. Gây lỗi cố ý: gọi `useFormStatus` trong `CommentBox` — quan sát `pending` mãi `false`; giải thích vì sao rồi sửa lại.
5. (Next.js) Đổi action thành Server Action trong `"use server"` file, dùng `revalidatePath` — kiểm tra data cập nhật mà không gọi `router.refresh()`.

## Reference
- [`useActionState` — react.dev](https://react.dev/reference/react/useActionState)
- [`useFormStatus` — react.dev](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`useOptimistic` — react.dev](https://react.dev/reference/react/useOptimistic)
- [Forms & Actions — react.dev](https://react.dev/reference/react-dom/components/form)
- [`4_react-new-feature/2_react-19`](../../4_react-new-feature/2_react-19/README.md) — Actions trong phần tính năng React 19
- Q37 — hiệu năng form + validate server; DAY 11 — controlled + RHF nền trước bài này
