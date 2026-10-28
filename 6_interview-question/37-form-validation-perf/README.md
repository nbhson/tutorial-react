# Q37: Form mấy chục ô, vừa gõ vừa validate từng ô mà không lag, em làm thế nào?

## Câu hỏi

> Form 15–20 field, muốn validate từng field khi user gõ (email, password, confirm, tên, họ, ...) mà UI không được lag.
> Viết bằng `useState` + tự check hợp lệ sau mỗi keystroke thì có gì vấn đề? Dùng `react-hook-form` + `zod` thì khác chỗ nào, và khi nào thì tự viết vẫn hợp lý hơn?

## Trả lời ngắn (elevator pitch, 30 giây)
- Tự viết `useState` + validate trong lúc render: mỗi phím gõ là vẽ lại **cả form + chạy lại toàn bộ rule** → 20 ô là lag.
- RHF + Zod: state form nằm ngoài React, gõ không vẽ lại; `register` không bind value; schema chạy một lần (debounce khi `mode: 'onChange'`).
- Form dưới 5 ô không check chéo thì tự viết + Zod check tay vẫn hợp lý. Form chéo/động/nhiều section thì RHF.

## Trả lời chi tiết

### 1. Vì sao "validate cả form mỗi keystroke" chết

```tsx
// SAI: re-render cả form + validate cả form mỗi phím
const [values, setValues] = useState(initial);
const errors = validateAll(values);  // chạy lại MỌI lần setValues
// input A gõ 1 ký tự → setValues({...values, a}) → render cả form + validate 20 field
```

Mỗi keystroke = **1 re-render form** + **chạy lại validation N field** (O(N) per keystroke → O(N×keys) tổng). **`react-hook-form` đảo ngược**: form state là **ref ngoài React**, React không re-render form khi gõ (đọc value qua `register` + internal ref, chỉ re-render "ô bị validate").

### 2. `react-hook-form` + `zod` (combo chuẩn 2026)

```tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "trùng", path: ["confirm"] });
type FormData = z.infer<typeof schema>;

export function Signup() {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",         // validate khi gõ (không phải khi submit)
    criteriaMode: "firstError", // chỉ show lỗi đầu tiên (đỡ "nổ đỏ" cả form)
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email?.message && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
```

**Điểm ăn điểm**: `zodResolver` + `refine` (cross-field) là 1 nguồn (Q18, Q35) — không "viết regex email 2 lần" (1 ở validation, 1 ở type).

### 3. So sánh 3 cách (quyết định)

| Cách | Khi nào | Vì sao |
|---|---|---|
| `useState` + tự validate (manual) | Form **< 5 field**, không cross-field | Ít code, hiểu hết — không cần lib |
| `react-hook-form` (no resolver) | Form có **dynamic fields** (add/remove), không cần schema nghiêm | Lib nhẹ, "khéo tay" |
| **`react-hook-form` + `zod` (resolver)** | Form **nghiêm túc** (cross-field, type-safe, API nhận cùng schema) | 1 schema = 1 type + 1 validate (Q35, Q18) — **chuẩn** |

**Q19 (bẫy kinh điển)**: "form thì luôn RHF" → **sai** (form 3 field thì `useState` đủ, thêm lib = overhead "nghi thức").

### 4. React 19 form Actions: validate ở server, hành vi async "miễn phí"

React 19 đưa form vào luồng **Actions**: `<form action={fn}>` — `fn` chạy (client handler hoặc Server Action), React quản `pending`/reset/retry; **validation có thể nằm ở server** mà form vẫn hiện lỗi ngay. Combo với `useActionState` + Zod chạy **cùng 1 schema ở cả 2 phía**:

```tsx
// app/actions.ts — SERVER: cùng schema Zod với client
"use server";
const Schema = z.object({ email: z.string().email(), pass: z.string().min(8) });

export async function signup(_prev: State, formData: FormData): Promise<State> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors }; // KHÔNG throw — trả lỗi về form
  }
  await createUser(parsed.data);
  return { errors: null };
}
```

```tsx
// Signup.tsx — CLIENT: useActionState nhận state lỗi + useFormStatus hiện pending
"use client";
const [state, action, pending] = useActionState(signup, { errors: null });

return (
  <form action={action}>
    <input name="email" />      {/* KHÔNG value/onChange — uncontrolled, React 19 giữ giá trị qua submit */}
    {state.errors?.email && <span>{state.errors.email[0]}</span>}
    <Submit />                  {/* trong Submit dùng useFormStatus() đọc pending */}
  </form>
);
```

**Vì sao không lag?** Input là **uncontrolled** (không `value`/`onChange` per keystroke) ⇒ gõ 0 re-render form; validate chạy **1 lần khi submit** ở server. Đây chính là hướng "perf" thứ ba cạnh RHF: state trong FormData (browser native), không nằm trong React.

**So với RHF + Zod client-side:**

| | RHF + Zod (client validate) | React 19 Actions (server validate) |
|---|---|---|
| Re-render khi gõ | 0 (ref-based) | 0 (uncontrolled + FormData) |
| Nguồn rule | Zod 1 chỗ, chạy client | Zod 1 chỗ, chạy **server** (client không giữ logic) |
| Chống bypass | Không — user tắt JS/đổi request là qua | Có — rule nằm server, luôn chạy |
| Progressive enhancement | Không (cần JS) | Có — form chạy cả khi JS chưa load |
| Cộng đồng/thư viện (autocomplete, dynamic fields) | RHF dày hơn | Vẫn thô hơn — form phức tạp UX nhiều thì RHF dễ sống hơn |

**Quyết định thực chiến (2026):** form CRUD / login → Actions + `useActionState` (đơn giản, an toàn, ít dep); form phức tạp nhiều tương tác client (wizard, dynamic rows, autosave) → RHF + Zod; validate nghiêm túc thì **luôn validate lại ở server** dù client đã check.

### 5. `useOptimistic` cho validate "trước" + `useFormStatus` cho nút submit

```tsx
function Submit() {
  const { pending } = useFormStatus(); // KHÔNG cần prop drilling từ form cha
  return <button disabled={pending}>{pending ? "Đang lưu..." : "Đăng ký"}</button>;
}
```

- **`useFormStatus`** đọc trạng thái `<form>` cha qua Context ẩn của React — component nút không cần nhận prop `pending` (chi tiết ở DAY 22 của `3_react-tutorial`).
- **`useOptimistic`** — với mutation inline (thêm item vào list), hiện kết quả kỳ vọng ngay, server từ chối thì rollback. Cặp đôi này thay thế phần lớn "loading state + disable nút" viết tay trước 19.

### 6. Ví dụ tổng hợp: form bình luận dùng Actions end-to-end

```tsx
// app/actions.ts
"use server";
const CommentSchema = z.object({
  body: z.string().min(3, "Ít nhất 3 ký tự").max(500, "Tối đa 500 ký tự"),
});
export type CommentState = { errors: { body?: string[] } | null; ok: boolean };

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const parsed = CommentSchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, ok: false };
  await db.comment.create({ data: parsed.data });
  revalidatePath("/post/1");           // data mới vào lần render sau
  return { errors: null, ok: true };
}
```

```tsx
// components/CommentForm.tsx
"use client";
import { useActionState, useRef } from "react";
import { addComment, type CommentState } from "./actions";

export function CommentForm() {
  const [state, action, pending] = useActionState<CommentState, FormData>(addComment, { errors: null, ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => { await action(fd); if (!state.errors) formRef.current?.reset(); }}
    >
      <textarea name="body" required minLength={3} />
      {state.errors?.body?.[0] && <p role="alert">{state.errors.body[0]}</p>}
      <SubmitButton /> {/* useFormStatus đọc pending của form cha */}
    </form>
  );
}
```

Điểm cần chỉ ra khi phỏng vấn:

- **Zod 1 nguồn 2 nơi**: cùng schema validate client (nếu cần live) và server (bắt buộc) — không trùng logic (Q35).
- **`revalidatePath`** — server quyết định data nào stale; client không tự refetch tay.
- **`role="alert"`** — lỗi validate phải tới được screen reader (Q42).
- **`formRef.reset()`** — action thành công mới reset; reset trước khi biết kết quả là bẫy kinh điển của form async.

### 7. Bảng tổng hợp 4 cách viết form (2026)

| Cách | Re-render khi gõ | Validate ở đâu | Dùng khi |
|---|---|---|---|
| Controlled `useState` | Mỗi phím | Client (tay) | < 5 field, không cross-field |
| RHF + Zod | 0 (ref-based) | Client (schema) | Form tương tác nặng, dynamic fields |
| React 19 Actions (`useActionState`) | 0 (uncontrolled) | **Server** (schema) | CRUD/login/mutation, cần chống bypass |
| Actions + RHF hybrid | 0 | Client live + server re-check | Enterprise: UX live + an toàn server |

Không có "cách đúng duy nhất" — có **ranh giới đúng**: mọi đường đều phải re-validate ở server; client validate chỉ là UX.

## Bẫy khi phỏng vấn

1. **"Validate cả form mỗi keystroke bằng `useState`"** → lag (Q17), RHF "tránh" bằng form state ngoài React (không re-render).
2. **"Zod thì chỉ cho type, không validate runtime"** → **sai** (Q18, Q35) — `zod` = schema runtime + `z.infer` (1 nguồn 2 mục đích).
3. **"`criteriaMode: 'firstError'` = chỉ validate ô đầu tiên"** → **sai** (chỉ **hiển thị** lỗi đầu tiên, validate cả form vẫn chạy — UX đỡ "nổ đỏ").
4. **"Cross-field (password/confirm) bằng `watch` mỗi ô"** → **sai** (bằng `refine` trên `zod`, chạy 1 lần, "1 nguồn").
5. **"React 19 Actions thay RHF hoàn toàn"** → **chưa đúng**: Actions lo mutation + validate server rất tốt, nhưng form tương tác nặng (dynamic fields, autosave, wizard) vẫn hợp RHF; và validate server **bổ sung** client validate, không thay thế.
6. **"Action throw Error là cách trả lỗi validation"** → **sai**: throw là lỗi hệ thống; validation error phải **trả về state** qua `useActionState` để form hiện cạnh field, không sập boundary.
7. **"Đặt `value` + `onChange` lên input trong form dùng action"** → tự biến uncontrolled thành controlled, mất lợi ích 0 re-render; để uncontrolled (`name` + `defaultValue`) và đọc qua FormData.

## Gợi ý câu chốt

> "Form N field: tự viết `useState` re-render form mỗi keystroke (Q17). **RHF + zod** = form state ngoài React (ref, không re-render) + `zodResolver` (validate 1 lần, `refine` cross-field, `z.infer` type = 1 nguồn — Q18, Q35). `mode: 'onChange'` + `criteriaMode: 'firstError'` = validate khi gõ, show 1 lỗi. Từ React 19 có thêm **Actions**: `<form action>` + `useActionState` + validate Zod **ở server** — input uncontrolled nên gõ 0 re-render, chống bypass, progressive enhancement; nút dùng `useFormStatus` đọc pending. **Quyết định (Q19)**: form < 5 field → tự viết; tương tác nặng → RHF+zod; CRUD/login → Actions; validation nghiêm túc luôn re-check server."

## Reference

- [`18-rhf-vs-controlled`](../18-rhf-vs-controlled/README.md) — "Vì sao nên dùng react-hook-form thay vì useState", `zodResolver`, `getValues`
- [`19-when-usestate-when-rhf`](../19-when-usestate-when-rhf/README.md) — "Khi nào useState, khi nào RHF/Zod"
- [`35-type-safety`](../35-type-safety/README.md) — "1 Zod schema = 1 type + 1 runtime check" (`z.infer`)
- [`17-controlled-form`](../17-controlled-form/README.md) — "Controlled form: state + event", "tại sao re-render mỗi keystroke"
- [React 19 — Actions & useActionState (react.dev)](https://react.dev/blog/2024/12/05/react-19)
- [`useActionState` reference](https://react.dev/reference/react/useActionState) · [`useFormStatus` reference](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`4_react-new-feature/2_react-19`](../../4_react-new-feature/2_react-19/README.md) — Actions demo trong tutorial
- [`3_react-tutorial/22-form-status`](../../3_react-tutorial/22-form-status/README.md) — `useFormStatus` + `useActionState` kết hợp thực hành
## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q18 — vì sao RHF thay vì controlled?](../18-rhf-vs-controlled/README.md) · [Q19 — khi nào useState, khi nào RHF?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — Zod 1 nguồn type+validate?](../35-type-safety/README.md) · [Q16 — form re-render nhiều, memo giúp gì?](../16-memo/README.md)
