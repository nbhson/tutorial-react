# DAY 22 — Hỏi & Đáp: Form Status & Actions

> File hỏi–đáp chi tiết cho `3_react-tutorial/22-form-status`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (demo chạy được).

---

## 1. `useActionState` khác `useState` chỗ nào?

**Hỏi:** Đã có `useState` + `onSubmit` rồi, tại sao phải `useActionState`?

**Đáp:**
- `useState` + `onSubmit` phải **tự viết** 3 thứ: `preventDefault`, cờ `isSubmitting`, chỗ lưu lỗi.
- `useActionState` gói cả 3: React tự chặn reload, cho sẵn `pending`, và **state = giá trị trả về của action gần nhất** — action trả gì, UI hiện nấy.
- Chữ ký action khác hàm thường: `(prevState, formData) => newState` — có `prevState` để tích lũy (đếm lần thử, gộp lỗi).

---

## 2. Vì sao `useFormStatus` phải nằm trong component con của `<form>`?

**Hỏi:** Đặt `useFormStatus()` ngay trong component chứa form thì sao?

**Đáp:**
- Hook đọc trạng thái của **form cha gần nhất** qua Context ẩn của React. Component chứa form không có form nào phía trên nó → `pending` mãi `false`.
- Đây là thiết kế **tận dụng vị trí trong cây** thay vì prop drilling: nút submit là component con tái sử dụng, tự biết form của nó đang gửi hay không.
- Cách nhớ: `useFormStatus` = "tôi là nút trong form, form tôi đang gửi chưa?" — không phải "form của tôi..." (nó không biết "của tôi" là form nào).

---

## 3. Lỗi validate nên `return` hay `throw` trong action?

**Hỏi:** Action check Zod fail — ném Error cho gọn không được à?

**Đáp:**
- **Không.** `throw` = lỗi hệ thống → đi vào Error Boundary → trang "Oops". Lỗi validate là **kết quả dự kiến** của submit sai.
- Quy ước react.dev: action **trả** `{ errors }` qua `useActionState`; UI hiện cạnh field với `role="alert"`.
- Chỉ `throw` khi thật sự bất thường: network chết, server 500, dữ liệu hỏng không thể xử lý.

---

## 4. `pending` của `useActionState` và `useFormStatus` — dùng cái nào?

**Hỏi:** Hai hook cùng cho `pending` — trùng lặp à?

**Đáp:**
- `useActionState` trả `pending` ở **component chứa form** (cùng nơi khai action).
- `useFormStatus` đọc ở **bất kỳ component con nào bên trong form** — cho nút submit tách file.
- Quy tắc: nút **cùng file** với form → dùng `pending` của `useActionState`; nút là **component con riêng/tái sử dụng** → `useFormStatus`. **Một nút, một nguồn** — dùng cả hai là 2 sự thật có thể lệch nhau.

---

## 5. Form dùng Actions có cần controlled input không?

**Hỏi:** Phải thêm `value`/`onChange` cho textarea trong form action?

**Đáp:**
- **Không — đừng thêm.** Action đọc qua `FormData` theo `name`, input uncontrolled: gõ 0 re-render.
- Thêm `value` + `onChange` là tự biến uncontrolled thành controlled: mất lợi ích perf, và state form giờ nằm ở 2 chỗ (React state + FormData).
- Chỉ dùng `defaultValue` khi cần giá trị khởi tạo; sau submit thành công thì `formRef.reset()`.

---

## 6. `useOptimistic` khi nào dùng, khi nào nguy hiểm?

**Hỏi:** Hiện kết quả trước server — lúc nào nên, lúc nào không?

**Đáp:**
- **Nên**: thao tác khả năng thành công cao, rollback vô hại — like, thêm comment, tick checkbox.
- **Không**: thao tác hủy/tiền bạc/xóa vĩnh viễn — rollback không hoàn toàn "như chưa có gì" (user đã thấy, đã tin).
- Cơ chế: gọi `addOptimistic(value)` **trong action trước khi await**; server chốt → React thay bằng data thật; throw/reject → tự rollback.

---

## 7. So với RHF (DAY 11): khi nào vẫn cần RHF?

**Hỏi:** Actions có thay react-hook-form không?

**Đáp:**
- Không thay — khác vai trò. Actions = mutation + validate server + uncontrolled đơn giản (CRUD, login, comment).
- RHF vẫn thắng ở form **tương tác nặng**: dynamic fields (`useFieldArray`), validate live theo keystroke (`mode: "onTouched"`), wizard nhiều bước, autosave.
- Thực chiến: **luôn re-validate ở server** dù client đã validate — client là UX, server là an toàn.

---

## 8. Lỗi thực chiến: submit kép khi API chậm?

**Hỏi:** User bấm 3 lần nhanh → 3 bình luận?

**Đáp:**
- `useFormStatus().pending` → `disabled={pending}` trên nút: bấm lần 2/3 không có hiệu lực.
- `useActionState` tự quản hàng đợi: `action(fd)` gọi lần nữa khi đang pending sẽ **chờ tuần tự** (React 19+), nhưng UI nên chặn sớm ở nút.
- Test: bấm 3 lần nhanh, network tab phải thấy đúng 1 request.

---

## 9. Trong Next.js, Server Action trả lỗi thế nào cho client?

**Hỏi:** Action chạy trên server — state errors đi đường nào về?

**Đáp:**
- Server Action trả giá trị serialize được → `useActionState` nhận như hàm client thường: `return { errors }`.
- `revalidatePath("/post/1")` trong action làm data stale → lần render sau lấy data mới; client **không** tự refetch.
- Không `throw` lỗi nghiệp vụ qua ranh giới server (mất ngữ cảnh, thành Boundary) — chỉ `throw` lỗi hệ thống.

---

## 10. Reset form sau submit — chỗ nào là đúng?

**Hỏi:** `reset()` gọi trong action hay ở client?

**Đáp:**
- **Sau khi biết kết quả**, ở client: bọc `action` — `await action(fd); if (!state.errors) formRef.current?.reset()`.
- Reset vô điều kiện trong action = user mất chữ vừa gõ khi validate fail (bẫy kinh điển).
- React cũng **reset form tự động** sau action thành công (uncontrolled) — nếu thấy cần reset thủ công, kiểm tra mình có đang trộn controlled không.

---

## Reference

- [`useActionState`](https://react.dev/reference/react/useActionState) · [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) · [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`<form>` component — react.dev](https://react.dev/reference/react-dom/components/form)
- DAY 11 — controlled + RHF nền trước bài này; Q37 — hiệu năng form + validate server
