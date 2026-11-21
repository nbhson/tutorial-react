# 2. Server Actions

## Mô tả

**Server Actions** (Server Functions) là tính năng **stable trong React 19 (12/2024)**, cho phép **gọi hàm server trực tiếp** từ form hoặc Client Component như gọi hàm thường — không cần tự viết REST endpoint. Hàm được đánh dấu `"use server"`, React sẽ serialize lời gọi, chạy trên server, rồi trả kết quả về để cập nhật UI.

Giống như gọi điện đặt món ăn trực tiếp đến nhà bếp thay vì phải viết thư xin lỗi đầu bếp qua lễ tân: bạn gọi hàm — server chạy — kết quả quay về. Còn "thủ tục hải quan" (serialize lời gọi) thì React tự lo.

Server Actions tích hợp sẵn với form (`<form action={...}>`), các hook `useActionState`, `useFormStatus`, `useOptimistic`, cùng `revalidatePath` / `revalidateTag` và `redirect` của framework.

> **Tóm gọn 1 câu:** Server Action = gọi hàm server từ client như gọi hàm thường — bỏ REST endpoint thủ công, React lo serialize + cập nhật UI.

## Mục tiêu

- Hiểu Server Action là gì và vì sao thay được REST endpoint thủ công.
- Biết gọi action từ form và từ Client Component, xử lý pending/error.
- Nắm nguyên tắc **bảo mật**: auth + validate **trên server**, không tin client.

## Vấn đề giải quyết

Mục này kể chuyện "mỗi lần làm feature mutation là một cuộc phiêu lưu" trước đây — đọc để thấy được mức độ boilerplate mà Server Actions cắt bỏ.

Trước đây, mọi mutation (tạo todo, đặt hàng, gửi mail) đều cần:

- Tạo route `/api/...` thủ công.
- Viết `fetch` POST từ client, quản lý loading/error bằng tay.
- Nhớ kiểm tra auth và revalidate dữ liệu — rất dễ quên.

Hệ quả: code phân tán, dễ bỏ sót auth, UI không tự refresh sau mutation.

Server Actions colocate mutation **ngay cạnh component**: framework lo serialize args, chạy server, và refresh UI qua revalidation. Bạn tập trung vào logic nghiệp vụ.

> **Tóm gọn 1 câu:** Trước đây mutation cần 3 lớp boilerplate (API route + fetch + quản lý state) — Server Actions gộp cả ba thành một hàm đặt cạnh component.

## Khái niệm cốt lõi

Mục này giới thiệu "dàn diễn viên chính": directive `'use server'`, form action, và 3 hook đi kèm — hiểu từng vai trước khi xem code.

- **`'use server'`**: đánh dấu một hàm (hoặc cả file) là Server Action. Hàm này chạy trên server, không bao giờ gửi code xuống client — chỉ tạo một tham chiếu RPC.
- **Form action**: `<form action={serverAction}>` — khi submit, React gọi action với `FormData`, hỗ trợ **progressive enhancement** (hoạt động cả khi JS chưa tải xong).
- **`useActionState`**: hook client giữ `state`, trả về `[state, formAction, isPending]` để hiển thị kết quả + trạng thái chờ.
- **`useFormStatus`**: đọc trạng thái pending của form cha (dùng trong component con của form).
- **`useOptimistic`**: cập nhật UI lạc quan trước khi server xác nhận.
- **Bảo mật**: action là **endpoint công khai** — bất kỳ ai cũng có thể gọi. Ví von: action giống như quầy giao dịch mở cửa cho mọi người — ai cũng chạm được, nên "nhân viên quầy" (server) phải tự kiểm tra giấy tờ (auth) và đối chiếu hồ sơ (validate), tuyệt đối không nghe lời khách nói "tôi đã được duyệt rồi". Vì thế phải **xác thực (auth) và kiểm tra dữ liệu (validate) trên server**, không bao giờ tin dữ liệu client gửi lên. Secret đọc từ biến môi trường server.

> **Tóm gọn 1 câu:** `'use server'` biến hàm thành endpoint công khai — vì thế auth + validate phải nằm trong chính action, client chỉ là "khách mời".

## Cú pháp / API

Mục này cho thấy "mặt chữ" của Server Action: cách khai báo và chữ ký hàm khi dùng với `useActionState`.

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

> 📄 **Code ví dụ:** [`examples/02-cu-phap-api.tsx`](examples/02-cu-phap-api.tsx)

Chữ ký mấu chốt: action dùng với `useActionState` nhận `(prevState, formData)` và trả về state mới.

## Luồng hoạt động (Flow)

Mục này lần theo hành trình một lời gọi action từ lúc bấm submit đến khi UI tự refresh — 8 bước, đọc tuần tự sẽ hiểu rõ "ai làm gì, lúc nào".

1. User submit form (hoặc client gọi `await createTodo(...)`).
2. React **serialize** args (FormData/arguments) thành một lời gọi RPC.
3. Gửi tới server — **function không ship xuống client**, chỉ có tham chiếu.
4. Server chạy action: **auth → validate → thao tác DB**.
5. `revalidatePath`/`revalidateTag` đánh dấu dữ liệu cần làm mới.
6. Server trả state/kết quả về; React cập nhật UI (pending → kết quả).
7. `redirect` (nếu gọi) điều hướng sau khi hoàn tất.
8. Nếu JS chưa tải, form vẫn submit được (progressive enhancement).

Hãy ví von như gửi đơn hàng qua đường bưu điện tự động: khách viết đơn (submit), bưu cục niêm phong (serialize), cơ sở sản xuất xử lý (auth → validate → DB), dán nhãn "cần làm mới kệ hàng" (revalidate), và gửi biên nhận về (state → UI).

> **Tóm gọn 1 câu:** Submit → serialize thành RPC → server chạy auth/validate/DB → revalidate → trả kết quả — và form vẫn chạy được kể cả khi JS chưa kịp tải.

## Ví dụ chi tiết

Mục này đưa vào một form tạo todo hoàn chỉnh — mọi hook nêu ở trên cùng xuất hiện trong một khối code duy nhất.

Xem [`example.tsx`](example.tsx). Diễn giải đầy đủ:

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

## Giải thích từng phần

- **`createTodo(prev, formData)`** — chữ ký "action" khi dùng `useActionState`: tham số đầu là state trước đó, thứ hai là `FormData`. Trả về state mới.
- **`formData.get('title')`** — đọc giá trị input theo `name="title"`. Không cần `useState` quản lý từng field.
- **`useActionState(createTodo, initialState)`** — trả về `[state, formAction, isPending]`. `formAction` gắn vào `<form action>`; `isPending` để disable input/nút.
- **`disabled={isPending}`** — chặn submit trùng lặp khi đang chờ server.
- **`state.message` + màu xanh/đỏ** — phản hồi server hiển thị ngay trong form.
- **So với thực tế** — trong app thật, thân `createTodo` sẽ `await auth()`, validate, ghi DB, và `revalidatePath('/todos')`; trong demo, ta mô phỏng để chạy được ở client.

## So sánh với cách làm cũ

Mục này bày ra 5 "nỗi khổ" của thời REST thủ công và cách Server Actions hóa giải từng cái.

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tạo `/api/...` route + `fetch` POST | Gọi Server Action trực tiếp | Bớt boilerplate, colocate với UI |
| Quản lý loading/error bằng `useState` | `useActionState` lo `isPending` + state | Ít code, nhất quán |
| Dễ quên auth/revalidate | Auth + `revalidatePath` ngay trong action | An toàn, UI tự refresh |
| Form cần JS mới hoạt động | Progressive enhancement | Hoạt động cả khi JS chưa tải |
| Validate rải rác ở client | Validate tập trung trên server | Không tin client, chống bypass |

> **Cách đọc bảng này:** đọc ngang từng hàng — cột "Cách cũ" là thứ bạn phải tự làm tay, cột "Cách mới" là thứ framework giờ lo giúp, cột "Lợi ích" là phần bạn được hưởng.

## Lỗi thường gặp

Mục này là 5 "bẫy bảo mật và kỹ thuật" hay gặp nhất với Server Actions — đặc biệt đáng đọc vì lỗi ở đây liên quan đến tiền và dữ liệu thật.

1. **Quên `'use server'`** ⇒ hàm chạy ở client, không có quyền truy cập DB/secret. *Fix:* thêm directive ở đầu file/hàm.
2. **Tin dữ liệu client, validate chỉ ở client** ⇒ lỗ hổng. *Fix:* luôn validate + auth lại **trong** action.
3. **Truyền secret từ client vào action** ⇒ lộ. *Fix:* action đọc secret từ `process.env` phía server.
4. **Không revalidate sau mutation** ⇒ UI vẫn dữ liệu cũ. *Fix:* gọi `revalidatePath`/`revalidateTag` tương ứng.
5. **Args/return không serializable** (function, class instance), hoặc **import client-only code vào file `'use server'`** ⇒ lỗi. *Fix:* chỉ truyền dữ liệu JSON-like và tách action sang file server riêng, không import module dính browser API.

## Khi nào dùng / Khi nào không

Mục này phân định "mutation dùng action, đọc dữ liệu không dùng" — quy tắc vàng để khỏi lạm dụng.

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

> **Tóm gọn 1 câu:** Server Action là "đường dây nóng" tới server cho mutation — nhưng nhớ: quầy ai cũng gọi được, nên auth + validate phải làm ngay trong action.

## Reference

- [`"use server"` (react.dev)](https://react.dev/reference/rsc/use-server)
- [Next.js Server Actions & Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [`useActionState`](https://react.dev/reference/react/useActionState)
