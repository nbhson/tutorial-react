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

## Bẫy khi phỏng vấn

1. **"Validate cả form mỗi keystroke bằng `useState`"** → lag (Q17), RHF "tránh" bằng form state ngoài React (không re-render).
2. **"Zod thì chỉ cho type, không validate runtime"** → **sai** (Q18, Q35) — `zod` = schema runtime + `z.infer` (1 nguồn 2 mục đích).
3. **"`criteriaMode: 'firstError'` = chỉ validate ô đầu tiên"** → **sai** (chỉ **hiển thị** lỗi đầu tiên, validate cả form vẫn chạy — UX đỡ "nổ đỏ").
4. **"Cross-field (password/confirm) bằng `watch` mỗi ô"** → **sai** (bằng `refine` trên `zod`, chạy 1 lần, "1 nguồn").

## Gợi ý câu chốt

> "Form N field: tự viết `useState` re-render form mỗi keystroke (Q17). **RHF + zod** = form state ngoài React (ref, không re-render) + `zodResolver` (validate 1 lần, `refine` cross-field, `z.infer` type = 1 nguồn — Q18, Q35). `mode: 'onChange'` + `criteriaMode: 'firstError'` = validate khi gõ, show 1 lỗi. **Quyết định (Q19)**: form < 5 field → tự viết; complex → RHF+zod (đừng thêm lib không cần, đừng tự viết validation phức tạp)."

## Reference

- [`18-rhf-vs-controlled`](../18-rhf-vs-controlled/README.md) — "Vì sao nên dùng react-hook-form thay vì useState", `zodResolver`, `getValues`
- [`19-when-usestate-when-rhf`](../19-when-usestate-when-rhf/README.md) — "Khi nào useState, khi nào RHF/Zod"
- [`35-type-safety`](../35-type-safety/README.md) — "1 Zod schema = 1 type + 1 runtime check" (`z.infer`)
- [`17-controlled-form`](../17-controlled-form/README.md) — "Controlled form: state + event", "tại sao re-render mỗi keystroke"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q18 — vì sao RHF thay vì controlled?](../18-rhf-vs-controlled/README.md) · [Q19 — khi nào useState, khi nào RHF?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — Zod 1 nguồn type+validate?](../35-type-safety/README.md) · [Q16 — form re-render nhiều, memo giúp gì?](../16-memo/README.md)
