# 2. Server Actions

## Mô tả

**Server Actions** (Server Functions) là tính năng **stable trong React 19 (12/2024)**, cho phép **gọi hàm server trực tiếp** từ form hoặc Client Component như gọi hàm thường — không cần tự viết REST endpoint. Hàm được đánh dấu `"use server"`, React sẽ serialize lời gọi, chạy trên server, rồi trả kết quả về để cập nhật UI.

Server Actions tích hợp sẵn với form (`<form action={...}>`), các hook `useActionState`, `useFormStatus`, `useOptimistic`, cùng `revalidatePath` / `revalidateTag` và `redirect` của framework.

## Mục tiêu

- Hiểu Server Action là gì và vì sao thay được REST endpoint thủ công.
- Biết gọi action từ form và từ Client Component, xử lý pending/error.
- Nắm nguyên tắc **bảo mật**: auth + validate **trên server**, không tin client.

## Vấn đề giải quyết

Trước đây, mọi mutation (tạo todo, đặt hàng, gửi mail) đều cần:

- Tạo route `/api/...` thủ công.
- Viết `fetch` POST từ client, quản lý loading/error bằng tay.
- Nhớ kiểm tra auth và revalidate dữ liệu — rất dễ quên.

Hệ quả: code phân tán, dễ bỏ sót auth, UI không tự refresh sau mutation.

Server Actions colocate mutation **ngay cạnh component**: framework lo serialize args, chạy server, và refresh UI qua revalidation. Bạn tập trung vào logic nghiệp vụ.

## Khái niệm cốt lõi

- **`'use server'`**: đánh dấu một hàm (hoặc cả file) là Server Action. Hàm này chạy trên server, không bao giờ gửi code xuống client — chỉ tạo một tham chiếu RPC.
- **Form action**: `<form action={serverAction}>` — khi submit, React gọi action với `FormData`, hỗ trợ **progressive enhancement** (hoạt động cả khi JS chưa tải xong).
- **`useActionState`**: hook client giữ `state`, trả về `[state, formAction, isPending]` để hiển thị kết quả + trạng thái chờ.
- **`useFormStatus`**: đọc trạng thái pending của form cha (dùng trong component con của form).
- **`useOptimistic`**: cập nhật UI lạc quan trước khi server xác nhận.
- **Bảo mật**: action là **endpoint công khai** — bất kỳ ai cũng có thể gọi. Vì thế phải **xác thực (auth) và kiểm tra dữ liệu (validate) trên server**, không bao giờ tin dữ liệu client gửi lên. Secret đọc từ biến môi trường server.

## Cú pháp / API

```tsx
// features/todos/actions.ts  — file server
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type State = { ok: boolean; message: string };

export async function createTodo(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const user = await auth(); // ✅ kiểm tra auth TRÊN SERVER
  if (!user) return { ok: false, message: 'Chưa đăng nhập' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { ok: false, message: 'Thiếu tiêu đề' }; // ✅ validate server

  await db.todo.create({ title, userId: user.id });
  revalidatePath('/todos'); // refresh dữ liệu trang /todos
  return { ok: true, message: `Đã tạo: ${title}` };
  // redirect('/todos'); // (tùy chọn) điều hướng
}
```

```tsx
// Client Component
'use client';
import { useActionState } from 'react';
import { createTodo } from './actions';

export function TodoForm() {
  const [state, formAction, isPending] = useActionState(createTodo, {
    ok: false,
    message: '',
  });
  return (
    <form action={formAction}>
      <input name="title" disabled={isPending} />
      <button disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo'}</button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

Chữ ký mấu chốt: action dùng với `useActionState` nhận `(prevState, formData)` và trả về state mới.

## Luồng hoạt động (Flow)

1. User submit form (hoặc client gọi `await createTodo(...)`).
2. React **serialize** args (FormData/arguments) thành một lời gọi RPC.
3. Gửi tới server — **function không ship xuống client**, chỉ có tham chiếu.
4. Server chạy action: **auth → validate → thao tác DB**.
5. `revalidatePath`/`revalidateTag` đánh dấu dữ liệu cần làm mới.
6. Server trả state/kết quả về; React cập nhật UI (pending → kết quả).
7. `redirect` (nếu gọi) điều hướng sau khi hoàn tất.
8. Nếu JS chưa tải, form vẫn submit được (progressive enhancement).

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

```tsx
// actions.ts (server):
// 'use server';
// import { revalidatePath } from 'next/cache';
// export async function createTodo(prev: State, formData: FormData): Promise<State> {
//   const title = String(formData.get('title') ?? '').trim();
//   if (!title) return { ok: false, message: 'Thiếu tiêu đề' };
//   await db.todo.create({ title });   // auth + validate ở đây (trên server)
//   revalidatePath('/todos');
//   return { ok: true, message: `Đã tạo: ${title}` };
// }

'use client';
import { useActionState } from 'react';

type State = { ok: boolean; message: string };

// Mô phỏng Server Action chạy phía server (demo chạy được ở client).
async function createTodo(prev: State, formData: FormData): Promise<State> {
  const title = String(formData.get('title') ?? '').trim();
  await new Promise((r) => setTimeout(r, 600)); // giả lập độ trễ server
  if (!title) return { ok: false, message: 'Thiếu tiêu đề.' };
  // Thực tế: ghi DB + revalidatePath('/todos') ở phía server.
  return { ok: true, message: `Đã tạo todo: ${title}` };
}

export default function TodoActionForm() {
  // useActionState: [state, formAction, isPending]
  const [state, formAction, isPending] = useActionState(createTodo, {
    ok: false,
    message: '',
  });

  return (
    <div>
      <h2>Server Actions + useActionState (RSC)</h2>
      {/* form.action nhận thẳng action — React lo submit + pending */}
      <form action={formAction}>
        <input name="title" placeholder="Việc cần làm..." disabled={isPending} />
        <button disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo'}</button>
      </form>
      {/* Hiển thị kết quả trả về từ action */}
      {state.message && (
        <p style={{ color: state.ok ? 'green' : 'red' }}>{state.message}</p>
      )}
    </div>
  );
}
```

## Giải thích từng phần

- **`createTodo(prev, formData)`** — chữ ký "action" khi dùng `useActionState`: tham số đầu là state trước đó, thứ hai là `FormData`. Trả về state mới.
- **`formData.get('title')`** — đọc giá trị input theo `name="title"`. Không cần `useState` quản lý từng field.
- **`useActionState(createTodo, initialState)`** — trả về `[state, formAction, isPending]`. `formAction` gắn vào `<form action>`; `isPending` để disable input/nút.
- **`disabled={isPending}`** — chặn submit trùng lặp khi đang chờ server.
- **`state.message` + màu xanh/đỏ** — phản hồi server hiển thị ngay trong form.
- **So với thực tế** — trong app thật, thân `createTodo` sẽ `await auth()`, validate, ghi DB, và `revalidatePath('/todos')`; trong demo, ta mô phỏng để chạy được ở client.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tạo `/api/...` route + `fetch` POST | Gọi Server Action trực tiếp | Bớt boilerplate, colocate với UI |
| Quản lý loading/error bằng `useState` | `useActionState` lo `isPending` + state | Ít code, nhất quán |
| Dễ quên auth/revalidate | Auth + `revalidatePath` ngay trong action | An toàn, UI tự refresh |
| Form cần JS mới hoạt động | Progressive enhancement | Hoạt động cả khi JS chưa tải |
| Validate rải rác ở client | Validate tập trung trên server | Không tin client, chống bypass |

## Lỗi thường gặp

1. **Quên `'use server'`** ⇒ hàm chạy ở client, không có quyền truy cập DB/secret. *Fix:* thêm directive ở đầu file/hàm.
2. **Tin dữ liệu client, validate chỉ ở client** ⇒ lỗ hổng. *Fix:* luôn validate + auth lại **trong** action.
3. **Truyền secret từ client vào action** ⇒ lộ. *Fix:* action đọc secret từ `process.env` phía server.
4. **Không revalidate sau mutation** ⇒ UI vẫn dữ liệu cũ. *Fix:* gọi `revalidatePath`/`revalidateTag` tương ứng.
5. **Args/return không serializable** (function, class instance), hoặc **import client-only code vào file `'use server'`** ⇒ lỗi. *Fix:* chỉ truyền dữ liệu JSON-like và tách action sang file server riêng, không import module dính browser API.

## Khi nào dùng / Khi nào không

**Dùng cho:**
- **Mọi mutation thuộc server**: ghi DB, thanh toán, gửi mail, tạo/xóa record.
- Form submission cần auth + validate server-side.
- Kết hợp `useOptimistic` để UX tức thì + `revalidatePath` để UI tươi.

**Cân nhắc / không nên:**
- **Đọc dữ liệu thuần** → dùng Server Component + `fetch`/`cache()` thay vì action.
- **Computation nặng chạy thường xuyên** → action là request/response; đừng lạm dụng như RPC nội bộ dày đặc.
- Không dùng action cho logic chỉ chạy ở client (animation, DOM).

## Bài tập nhỏ

Viết Server Action `deleteTodo(id: string)` có `'use server'`, kiểm tra quyền sở hữu trên server, xóa record rồi `revalidatePath('/todos')`. Gọi action từ một Client Component bằng `useTransition` để hiển thị pending, và dùng `useOptimistic` để ẩn todo khỏi danh sách ngay khi bấm trước khi server phản hồi.

## Reference

- [`"use server"` (react.dev)](https://react.dev/reference/rsc/use-server)
- [Next.js Server Actions & Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [`useActionState`](https://react.dev/reference/react/useActionState)
