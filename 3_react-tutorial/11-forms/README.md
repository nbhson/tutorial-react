# DAY 11: FORMS (REACTIVE & TEMPLATE-DRIVEN)

## Mục tiêu bài học
- Nắm tư duy form React: **controlled input** (state là nguồn duy nhất) thay cho `FormsModule` + `ngModel`, và cách tự viết validate.
- Làm chủ bộ ba chuẩn 2026: **react-hook-form (RHF) + Zod + zodResolver** — tương đương Reactive Forms + Validators của Angular nhưng gọn nhẹ hơn.
- Biết quyết định: form nhỏ → `useState`; form phức tạp/validate mạnh → RHF + Zod.

## Khái niệm cốt lõi (Core)
- **Controlled input:** `<input value={state} onChange={...}/>` — chữ người gõ đi vào state, state render lại input. Dữ liệu luôn đồng bộ một chiều rõ ràng (đã học DAY 1, giờ vận dụng cho form thật).
- **Uncontrolled input** (dùng `ref`/`defaultValue`): DOM tự giữ giá trị — ít dùng, nhưng RHF tận dụng hiệu quả để **giảm re-render** (không phải setState mỗi phím gõ).
- **react-hook-form (RHF):** `useForm<T>()` + `{...register("field")}` — đăng ký field, tự lấy `name`/`value`/`onChange`, ít re-render nhờ uncontrolled + ref-based.
- **Zod:** schema runtime validation — define 1 schema, suy type `z.infer<typeof Schema>`, tái dùng cho API/server/shared package. `zodResolver` cắm schema vào RHF: validate khi submit (và khi blur nếu muốn).
- **`formState.errors`:** bản đồ lỗi theo field; hiển thị `{errors.email?.message}` ngay cạnh input.
- **Đối chiếu Angular:** `FormControl` += `Validators` ↔ RHF + Zod; `formControlName` ↔ `{...register("email")}`; `setValidators` ↔ schema endpoint. RHF không có class FormGroup — "form" là một object + schema.
- **Keyword chính:** controlled, `react-hook-form`, `useForm`, `register`, `handleSubmit`, `zodResolver`, `errors`, `z.infer`, submit flow.

## Luồng hoạt động (Flow)
1. Mount: `useForm<Form>({ resolver: zodResolver(Schema) })` — schema Zod đã validate email + password.
2. Render: `register("email")` trả về `{ name, onChange, onBlur, ref }`; spread vào input → RHF "đăng ký" field đó (register đăng ký càng sớm càng tốt, RN rerender không).
3. User gõ: value lưu trong DOM/ref của RHF — **không setState từng ký tự** (khác với controlled thuần) → không re-render form mỗi phím.
4. User submit: `handleSubmit((data) => ...)` chạy `zodResolver.validate(data)`.
5. Nếu lỗi: `/errors` được điền → component re-render hiện `<small>` lỗi cạnh từng field (errors.email.message).
6. Nếu OK: callback nhận `data: Form` sạch, đã đúng kiểu (`z.infer`) — bạn gọi API, navigation, etc.
7. (Bản thuần `useState` ở README gốc: mất bước 3–5 — setState + tổ chức lỗi thủ công.)

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 11: controlled form thuần (không cần lib)
import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(""); // lỗi tổng

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); // chặn reload trang
    // Validate tay theo từng điều kiện
    if (!email.includes("@")) return setErr("Email không hợp lệ");
    if (pass.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự");
    setErr("");
    alert(`Login OK: ${email}`);
  };

  return (
    <form onSubmit={submit}>
      {/* Mỗi phím gõ -> setName -> re-render -> input khớp state */}
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mật khẩu" />
      {err && <p style={{ color: "red" }}>{err}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

```tsx
// RHF + Zod (prod) — cài `npm i react-hook-form zod @hookform/resolvers`
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 1 schema = nguồn sự thật: validate + suy type
const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
});
type Form = z.infer<typeof Schema>;

export default function Login() {
  // resolver đưa schema vào luồng validate của RHF
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });
  return (
    <form onSubmit={handleSubmit((d) => alert(JSON.stringify(d)))}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <small>{errors.email.message}</small>}
      <input type="password" {...register("pass")} placeholder="Mật khẩu" />
      {errors.pass && <small>{errors.pass.message}</small>}
      <button>Login</button>
    </form>
  );
}
```

## Giải thích từng phần
- `e.preventDefault()`: bắt buộc trong form submit — nếu không, trình duyệt reload trang, app React chết. Đây là nguồn bug #1 của người mới.
- `return setErr(...)`: dừng hàm + đặt lỗi — "fail fast". Bản thuần đủ cho form 2–3 field; khi field nhiều, việc tự nối lỗi dần vỡ.
- `register("email")`: "formControlName" của RHF. Trả về `{name, onBlur, onChange, ref}` — spread lên input là xong đăng ký. Không cần `value` từ state → không re-render mỗi phím gõ (RHF dùng ref).
- `handleSubmit((d) => ...)`: RHF đóng gói: chặn submit mặc định, validate qua resolver, chỉ gọi callback khi sạch lỗi. `d` có kiểu `Form` từ `z.infer` — dữ liệu đúng kiểu mà không cần cast.
- `errors.email && <small>{errors.email.message}</small>`: thông điệp từ chính `schema` Zod — viết một nơi, dùng nhiều nơi (client + server + hợp đồng API).
- `type Form = z.infer<typeof Schema>`: một schema → type TS tự suy — không viết type trùng lặp.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `FormsModule` + `[(ngModel)]` | controlled `useState` (value + onChange) | Cùng "single source of truth" |
| `ReactiveForms` `FormGroup`/`FormControl` | `useForm<T>()` | Không có class FormGroup — object + schema |
| `Validators.required`/`email` | `z.string().email()` / `.min()` | Zod mạnh hơn (regex, refine, pick...) |
| `formControlName="email"` | `{...register("email")}` | Spread từ RHF |
| `errors['email']` | `formState.errors.email` | Cùng cách đọc lỗi field |
| `form.valueChanges` subscribe | `watch("email")` (RHF) | RxJS stream ↔ subscription lightweight |
| Async validate | `z.refine(async ...)` / resolver async | Có thể await server |
| `FormArray` | `useFieldArray` (RHF) | List động trong form |

## Lỗi thường gặp (Common pitfalls)
- **Quên `type="submit"`** → bấm button không submit form. → Fix: đặt `type="submit"` cho nút chính.
- **Reset form**: sau submit không xóa — → Fix: `reset()` từ useForm (hoặc set state ban đầu lại cho bản thuần).
- **Validate schema nhưng không đưa message vào UI** — lỗi có ở `errors` nhưng không render → người dùng mơ hồ. → Fix: luôn render `errors.x?.message` gọn cạnh field.
- **Dùng `defaultValues` lệch type** — `z.infer` suy number nhưng defaultValue string → lỗi runtime. → Fix: khai `defaultValues` với type `Partial<Form>`.
- **Hiệu năng controlled thuần với form lớn** — setState mỗi phím gõ re-render cả form. → Fix: chuyển RHF (uncontrolled) hoặc tách field thành component nhỏ.
- **Không `z.coerce` cho số** — `<input type="number">` trả string; `z.number()` fails. → Fix: `z.coerce.number()` hoặc validate kiểu string trước.
- **Submit nhiều lần khi đang gọi API** → gửi trùng. → Fix: `formState.isSubmitting` (RHF) disable button.

## Best practices / Mẹo
- **Rule 2026:** form <5 field, validate đơn giản → `useState`; form lớn, nhiều quy tắc, nested/list → **RHF + Zod**; dùng `zodResolver` (không tự viết validate thủ công trong RHF).
- Chia schema nhỏ theo domain: `z.object({...}).extend(...)`, `z.infer` tạo type dùng chung cho API layer.
- `mode: "onTouched"` để validate khi blur — cân bằng giữa "báo sớm" và "khó chịu".
- Kết hợp `Controller` (RHF) khi dùng component UI không phải input (select từ shadcn, datepicker): truyền `control` + render props.
- Dùng `useFieldArray` thay vì tự quản lý mảng dynamic; `watch` chỉ khi cần UI phản ứng theo giá trị (tổng tiền live preview).
- Giữ message lỗi nằm trong schema (Zod) — thay đổi 1 chỗ, đồng bộ client + docs.

## Bài tập nhỏ
1. Nâng form Login (bản RHF) lên 4 field: `name`, `email`, `pass`, `confirmPass` với refine `confirmPass === pass` (Zod `.refine`) — hiển thị lỗi cho từng field.
2. Thêm `import { useFieldArray }` xây form "thêm dòng sản phẩm động": nút "Thêm dòng", mỗi dòng có `name` + `price`; khi submit in JSON — kiểm tra zod schema mảng hoạt động với dữ liệu động.

## Reference
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react-hook-form.com/
- https://zod.dev/
- https://github.com/react-hook-form/resolvers