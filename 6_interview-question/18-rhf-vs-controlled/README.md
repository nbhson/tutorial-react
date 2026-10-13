# Q18: Sao form lớn đông người lại dùng react-hook-form thay vì mỗi input một `useState`?

## Câu hỏi

> Form to, gõ từng chữ mà form re-render liên tục thì mệt — react-hook-form (RHF) giải quyết chuyện này khác controlled viết tay (useState) ở điểm nào?
> `register()` hoạt động ra sao, và Zod (`zodResolver`) đóng vai trò gì trong chuyện validate?
> So với Angular Reactive Forms thì RHF như thế nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Controlled thuần** (Q17): mỗi phím gõ = `setState` → **re-render cả form**. **RHF** dùng **uncontrolled + ref-based**: giá trị nằm trong **DOM** (RHF "đăng ký" input qua `register`), gõ **không re-render** — chỉ re-render khi **hiện lỗi** (blur, theo `mode`) hoặc **submit**.
- **`register("email")`** trả `{ name, onChange, onBlur, ref }` — spread vào `<input {...register("email")} />` là RHF "đăng ký" field. Không cần `value` từ state.
- **Zod + `zodResolver`**: schema runtime (validate 1 lần, tái dùng client/server), `zodResolver` cắm schema vào RHF (submit chạy validate, lỗi vào `formState.errors`), `z.infer` suy type TS từ schema (không viết type 2 lần).
- **Đối chiếu Angular**: RHF + Zod ≈ **Reactive Forms + Validators** (nhưng không có class `FormGroup`, gọn hơn).

## Trả lời chi tiết

### 1. Chênh lệch CỐT LÕI: "khi nào re-render"

| | Controlled thuần (Q17) | RHF (`register`) |
|---|---|---|
| Giá trị nằm ở | **State** React | **DOM** (ref của RHF, ngoài React state) |
| Gõ 1 phím | `setState` → **re-render form** | **Không re-render** (RHF chỉ ghi ref + trigger validate nếu `mode` bật) |
| Re-render khi nào | Mỗi phím | Chỉ khi **hiện lỗi** (blur/submit) hoặc **submit** (data vào callback) |
| Đọc giá trị | state (nguồn rõ ràng) | RHF "đọc DOM" (ref) lúc submit/blur |
| Form 2 field | Ổn định (ít render) | Cũng ổn (nhưng không cần — **overkill cho form nhỏ**) |
| Form 30 field + validate nặng | **Lag** (mỗi phím render) | **Mượt** (giới hạn re-render đúng lúc hiện lỗi) |

> **Nói "đúng" câu chốt**: RHF **không** đổi ngữ nghĩa form (submit vẫn có **một nguồn sự thật** — giá trị DOM là chính), chỉ đổi **địa điểm lưu giá trị tạm** (DOM thay vì state) **để giảm re-render mỗi phím**. (Ngụ ý: controlled là **mô hình dữ liệu** đúng; RHF là **tối ưu hiệu năng** trên cùng mô hình — không mâu thuẫn, xem bẫy §4.)

### 2. `register` hoạt động ra sao (bước-by-bước)

```tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
});
type Form = z.infer<typeof Schema>; // 1 schema -> 1 type (không viết 2 lần)

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(Schema), mode: "onTouched" });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d, /* d: Form */))}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <small role="alert">{errors.email.message}</small>}
      <input type="password" {...register("pass")} placeholder="Mật khẩu" />
      {errors.pass && <small role="alert">{errors.pass.message}</small>}
      <button disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Login"}</button>
    </form>
  );
}
```

**`register("email")` trả về gì + RHF dùng nó làm gì:**

- `{ name: "email", onChange, onBlur, ref }` (4 prop) — bạn **spread** vào input (input **trở thành uncontrolled** — không có `value` từ bạn).
- **`ref`**: RHF gắn vào input thật → **đọc được `input.value` khi submit/blur** (không cần bạn quản lý DOM).
- **`onChange`/`onBlur`** (nội bộ RHF): **ghi giá trị vào store RHF** + trigger validate theo `mode` (`onTouched` = **blur mới validate**, `onChange` = **mỗi lần đổi**, v.v.).
- **Bạn** chỉ quyết định: tên field (`"email"`) + **nơi hiện lỗi** (`errors.email`).

### 3. Zod + `zodResolver` + `z.infer` — "bộ ba" chuẩn 2026

| Mảnh | Làm gì | Vì sao đắt giá |
|---|---|---|
| **Zod** (`Schema`) | Validate **runtime** (1 định nghĩa, sát rule: email, min length...) | **Tái dùng client + server + docs** (1 sở rule, không viết lại ở API) |
| **`zodResolver(Schema)`** | Cắm schema vào RHF (`handleSubmit` chạy validate trước callback; lỗi vào `errors`) | RHF **không cần biết nguyên tắc validate** (bạn thay đổi rule ở schema, RHF vẫn vô quan tâm logic) |
| **`z.infer<typeof Schema>`** | Suy type TS từ schema (callback nhận `d: Form`) | **Không viết type 2 lần** (schema + interface rồi lệch — 1 nơi định nghĩa = 1 nguồn sự thật cho cả type + rule) |

**Mở rộng (nếu bị hỏi sâu):**

- **Cross-field** (confirm = pass): `z.refine((d) => d.confirm === d.pass, { message: "...", path: ["confirm"] })` (Angular phải viết validator thủ công).
- **Number từ input**: `z.coerce.number()` (input number trả về **string** — `coerce` đổi trước khi validate).

### 4. Đối chiếu Angular (điểm ăn điểm)

| Angular (Reactive Forms) | RHF + Zod | Ghi chú |
|---|---|---|
| `FormControl` + `Validators.required/email` | `z.string().email()` (Zod schema) | Zod mạnh hơn Validators (refine, coerce, pick/extend) |
| `formControlName="email"` (template) | `{...register("email")}` (JSX) | Cùng ý: **đăng ký field** |
| `form.valueChanges` | `watch("email")` (RHF) | Một chiều (không two-way) |
| Async validator | `z.refine(async ...)` | Cùng ý (validate không đồng bộ) |
| `FormArray` | `useFieldArray({ control, name })` | Dynamic list (thêm/xóa dòng) |
| `FormGroup` (class) | **Không có class** — form = object values + schema + `mode` | RHF gọn hơn (không kế thừa class) |

### 5. `mode` — "vòng validate" (mất ít điểm nếu không biết)

`useForm({ mode: "onTouched" })` quyết định **khi nào RHF chạy validate** (hiện lỗi):

- `"onTouched"` (blur mới báo lỗi) — **cân bằng** giữa báo sớm và khó chịu (default tốt).
- `"onChange"` (mỗi phím báo lỗi) — cảnh báo nặng.
- `"onSubmit"` (chỉ khi submit) — ít khó chịu, nhưng thông báo trễ.

**Luôn**: **submit** validate **toàn bộ** (bất luận `mode`) — đây là điểm khác với mỗi phím (hiện lỗi sớm hay muộn tùy `mode`); **submit luôn kiểm tra toàn bộ**.

## Bẫy khi phỏng vấn

1. **"Nói RHF 'nhanh hơn controlled vì không re-render'"** (suông) → đúng ở **hiệu năng** (ít re-render mỗi phím) nhưng **không** đúng rằng "nó đổi mô hình dữ liệu" (giá trị vẫn **một nguồn sự thật** khi submit; chỉ lưu tạm ở DOM).
2. **"RHF + Zod 'thay thế' controlled cho mọi form"** → **không đúng** (xem Q19 quy tắc chọn — form nhỏ vẫn `useState` đơn giản hơn hết).
3. **"Quên `e.preventDefault()` ở `onSubmit` (RHF)"** → **không cần** (RHF tự chặn default qua `handleSubmit`) — khác controlled thuần (phải thêm bằng tay). Đây là điểm nhiều người mới vẫn thêm `preventDefault` "dư thừa" (không gây lỗi, chỉ thừa).
4. **Truyền `value` (controlled) + `register` (uncontrolled) cùng lúc** → **mâu thuẫn** (React cảnh báo controlled→uncontrolled). **Chọn một**: default RHF = uncontrolled via `register`; nếu cần **ghi đè value từ bên ngoài** (ví dụ reset từ nút khác) → dùng `Controller` (nguyên sâu thêm).
5. **Selector trả object mới** (`s => ({ a: s.a })`) → không liên quan RHF (đó là store, Q15) — nhưng RHF **tương tự**: luôn **đọc giá trị theo field** (không đọc cả `formState` toàn bộ nếu không cần).

## Gợi ý câu chốt

> "RHF (react-hook-form) khác controlled thuần (Q17) ở **địa điểm lưu giá trị tạm**: controlled = state (mỗi phím re-render), RHF = DOM/uncontrolled + `register` (không re-render khi gõ, chỉ hiện lỗi khi blur/submit). `register("email")` trả `{ name, onChange, onBlur, ref }` — spread là đăng ký field. Zod + `zodResolver` + `z.infer` = bộ ba chuẩn: schema runtime (tái dùng), cắm validate vào RHF (lỗi vào `formState.errors`), suy type từ schema (không viết type 2 lần). **RHF là tối ưu hiệu năng, không đổi mô hình dữ liệu (một nguồn sự thật khi submit). Quy tắc chọn: xem Q19.**"

## Reference

- [`3_react-tutorial/11-forms`](../../3_react-tutorial/11-forms) — RHF + Zod full, `useFieldArray`, `Controller`, đối chiếu Angular Forms
- [`3_react-tutorial/11-forms/question-answer.md`](../../3_react-tutorial/11-forms/question-answer.md) — Hỏi & đáp chi tiết (controlled, RHF, Zod, khi nào dùng gì)
- Q17 (Controlled form) — so sánh trực tiếp với RHF
- Q19 (useState vs RHF) — quy tắc chọn

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q17 — controlled form thuần hoạt động ra sao?](../17-controlled-form/README.md) · [Q19 — khi nào thì chưa cần RHF?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — Zod (zodResolver, z.infer) giữ type xuyên suốt form?](../35-type-safety/README.md) · [Q32 — form submit là 1 mutation (optimistic UI)?](../32-query-mutations/README.md)
