# DAY 11: FORMS (REACTIVE & TEMPLATE-DRIVEN)

## Mục tiêu bài học
- Nắm tư duy form React: **controlled input** (state là nguồn duy nhất) thay cho `FormsModule` + `ngModel`, và cách tự viết validate.
- Làm chủ bộ ba chuẩn 2026: **react-hook-form (RHF) + Zod + zodResolver** — tương đương Reactive Forms + Validators của Angular nhưng gọn nhẹ hơn.
- Biết quyết định: form nhỏ → `useState`; form phức tạp/validate mạnh → RHF + Zod.

## Khái niệm cốt lõi (Core)

### 1. Controlled input — state là nguồn duy nhất
`<input value={state} onChange={e => setState(e.target.value)} />`: chữ gõ vào đi vào state, state vẽ lại input. Đã học DAY 1, giờ vận dụng cho form thật với submit + validate + lỗi.

```tsx
// example.tsx dùng đúng pattern này cho 2 field:
const [email, setEmail] = useState("");
<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
// Gõ "a@b" -> onChange -> setEmail -> re-render -> input hiện "a@b", <p> lỗi (nếu có) cập nhật
```

Vì sao single source of truth? Vì muốn biết form hiện gì, validate gì, disable nút không — chỉ nhìn state. Không có chuyện DOM giữ một giá trị, state giữ giá trị khác. Giá phải trả: mỗi phím là một `setState` + re-render form. Form 2-3 field không sao; form 30 field + validate nặng mỗi phím thì lag — đó là lúc RHF uncontrolled phát huy (mục 3).

### 2. Uncontrolled input — DOM giữ, đọc khi cần
Dùng `ref`/`defaultValue`, React không kiểm soát mỗi phím. Ít dùng cho form tay, nhưng RHF tận dụng để **giảm re-render**: value nằm ở DOM/ref nội bộ RHF, chỉ submit/blur mới đọc + validate + re-render lỗi.

```tsx
// Uncontrolled thuần (hiếm dùng tay, nhưng là nguyên lý RHF):
import { useRef } from "react";
function Quick() {
  const ref = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert(ref.current?.value); };
  return <form onSubmit={submit}><input ref={ref} defaultValue="" /></form>;
}
// Gõ 100 phím -> 0 lần re-render (không setState). Submit mới đọc 1 lần.
```

Vì sao controlled vẫn mặc định? Vì uncontrolled khó validate live (hiện lỗi khi gõ), khó disable nút theo input, khó format live. Chỉ chuyển uncontrolled (qua RHF, không phải tay) khi đo được controlled lag.

### 3. react-hook-form — `useForm` + `register`, ít re-render nhờ ref
`useForm<T>()` tạo form; `{...register("email")}` spread `{ name, onChange, onBlur, ref }` vào input để RHF "đăng ký" field. Không cần `value` từ state → gõ không re-render. Validate qua resolver, lỗi vào `formState.errors`.

```tsx
// RHF + Zod prod (cài npm i react-hook-form zod @hookform/resolvers):
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const Schema = z.object({
  email: z.string().email("Email không hợp lệ"), // message nằm trong schema — 1 chỗ
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
});
type Form = z.infer<typeof Schema>; // 1 schema -> type TS, không viết type trùng

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema), // cắm schema vào luồng validate RHF
    mode: "onTouched", // validate khi blur — cân bằng báo sớm vs khó chịu
  });
  return (
    <form onSubmit={handleSubmit((d) => alert(JSON.stringify(d)))}>
      {/* register trả name/onChange/onBlur/ref — spread là đăng ký xong */}
      <input {...register("email")} placeholder="Email" />
      {errors.email && <small role="alert">{errors.email.message}</small>}
      <input type="password" {...register("pass")} placeholder="Mật khẩu" />
      {errors.pass && <small role="alert">{errors.pass.message}</small>}
      <button disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Login"}</button>
    </form>
  );
}
```

Vì sao spread `{...register("email")}` mà không `value`/`onChange` tay? Vì RHF cần gắn `ref` (đọc DOM) + `onChange`/`onBlur` nội bộ (ghi vào store RHF + trigger validate). Bạn chỉ quyết tên field (`"email"`) và nơi hiện lỗi. `handleSubmit` bọc: chặn reload mặc định, chạy resolver, chỉ gọi callback khi sạch lỗi với `data: Form` đúng kiểu.

### 4. Zod — schema là nguồn sự thật cho validate + type
Define 1 schema runtime, suy type `z.infer`, tái dùng client/server/shared package. `zodResolver` cắm vào RHF. Mạnh hơn `Validators` Angular (regex, refine cross-field, coerce, pick/extend).

```tsx
// Cross-field: confirm khớp pass — Angular phải validator tay, Zod .refine:
const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
  confirm: z.string(),
}).refine((d) => d.confirm === d.pass, { message: "Xác nhận không khớp", path: ["confirm"] });

// Số từ input number là string -> coerce (bẫy số 1):
const NumSchema = z.object({ age: z.coerce.number().min(0) }); // "20" -> 20, không fail
```

Vì sao message trong schema? Vì thay đổi 1 chỗ, đồng bộ client + server + docs. Vì sao `z.infer`? Vì không viết type 2 lần (schema + interface) rồi lệch nhau.

### 5. `formState.errors` — bản đồ lỗi theo field
`errors.email?.message` hiện cạnh input đó. Lỗi từ resolver (Zod) nên đúng message bạn viết trong schema. Kết hợp `mode: "onTouched"` để blur mới báo (không báo đỏ ngay khi mở form), submit luôn validate hết.

### 6. Đối chiếu Angular
`FormControl` + `Validators.required/email` ↔ RHF + Zod (`z.string().email()`); `formControlName="email"` ↔ `{...register("email")}`; `errors['email']` ↔ `formState.errors.email`; `valueChanges` ↔ `watch("email")`; async validator ↔ `z.refine(async ...)`; `FormArray` ↔ `useFieldArray`; `setValidators` động ↔ schema khác theo bước. RHF không có class FormGroup — "form" là object values + schema + mode.

### Keyword chính
controlled (`value` + `onChange`), uncontrolled (`ref`/`defaultValue`), `react-hook-form` (`useForm`, `register`, `handleSubmit`, `watch`, `reset`, `useFieldArray`, `Controller`), Zod (`z.object`, `z.infer`, `zodResolver`, `refine`, `coerce`), `formState.errors/isSubmitting`, submit flow (`preventDefault`).

## Luồng hoạt động (Flow)
1. Mount bản thuần: `useState("")` cho email/pass/err/submitting. Render 2 input controlled + nút `type="submit"`.
2. User gõ "a": `onChange` → `setEmail("a")` → re-render → input hiện "a". Mỗi phím một vòng (khác RHF không render).
3. User bấm Login/Enter: `onSubmit` fire → `e.preventDefault()` chặn reload (không có dòng này là trang trắng, state mất).
4. Validate tay fail-fast: `if (!email.includes("@")) return setErr(...)` — dừng ngay lỗi đầu, không check tiếp. `submitting` chặn bấm kép.
5. Lỗi → `setErr` → re-render hiện `<p role="alert">` đỏ. Đúng → `setErr("")`, `setSubmitting(true)`, giả lập API 500ms, `alert`, reset tay 2 field, `setSubmitting(false)`.
6. Bản RHF: `useForm({ resolver })` mount; `register("email")` spread `{ name, onChange, onBlur, ref }` vào input — RHF đăng ký field (uncontrolled, value ở DOM).
7. User gõ: value lưu ở DOM/ref RHF — **không setState mỗi phím** → không re-render form. Blur (mode onTouched) thì validate field đó → lỗi vào `errors`.
8. Submit: `handleSubmit(cb)` chặn mặc định, chạy `zodResolver` trên toàn bộ values. Lỗi → `errors` đầy → re-render hiện `<small>` cạnh từng field. Sạch → `cb(data: Form)` với type `z.infer` — gọi API/navigate.
9. List động: `useFieldArray({ control, name: "items" })` cho thêm/xóa dòng (`append`/`remove`) mà schema mảng Zod validate theo. Component ngoài (select shadcn): `<Controller control name render={({ field }) => <Select {...field} />} />`.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (controlled thuần + submitting + reset):

```tsx
// example.tsx — DAY 11: controlled thuần + RHF+Zod prod + useFieldArray + Controller ý tưởng
// Mục đích: form nhỏ -> useState đủ; form lớn -> RHF (uncontrolled, ít render) + Zod schema.
import { useState } from "react"; // (1) Controlled thuần: mỗi phím setState -> re-render

export default function App() {
  // (2) Mỗi field một state — đơn giản khi 2-3 field, phình khi 10+ field (lúc đó dùng RHF dưới).
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(""); // (3) Lỗi tổng demo; RHF có errors theo từng field (xem README)
  const [submitting, setSubmitting] = useState(false); // (4) Chặn submit kép — RHF có isSubmitting sẵn

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); // (5) BẮT BUỘC: không chặn là trình duyệt reload, app React chết — bug #1 người mới
    // (6) Validate tay fail-fast: dừng + đặt lỗi ngay điều kiện đầu tiên sai
    if (submitting) return; // chặn bấm liên tục khi đang gọi API
    if (!email.includes("@")) return setErr("Email không hợp lệ");
    if (pass.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự");
    setErr("");
    setSubmitting(true);
    // (7) Giả lập gọi API async rồi reset — RHF có reset() sẵn
    setTimeout(() => {
      alert(`Login OK: ${email}`);
      setEmail(""); setPass(""); // reset tay; RHF: reset()
      setSubmitting(false);
    }, 500);
  };

  return (
    <form onSubmit={submit}>
      {/* (8) Controlled: value đọc state + onChange ghi ngược — single source of truth (DAY 1) */}
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mật khẩu" aria-label="Mật khẩu" />
      {/* (9) Lỗi render cạnh form; RHF render errors.email.message cạnh từng input (xem README) */}
      {err && <p style={{ color: "red" }} role="alert">{err}</p>}
      {/* (10) type="submit" để Enter cũng submit; disabled khi đang gửi — RHF: isSubmitting */}
      <button type="submit" disabled={submitting}>{submitting ? "Đang gửi..." : "Login"}</button>
    </form>
  );
}

// Ghi chú prod (không chạy trong file này, xem README để copy):
// - RHF + Zod: useForm({ resolver: zodResolver(Schema) }) + {...register("email")} —
//   uncontrolled qua ref nên gõ không re-render form mỗi phím (khác controlled thuần trên).
// - Schema Zod 1 nguồn: z.object({ email: z.string().email(), pass: z.string().min(6) }) +
//   z.infer suy type — dùng chung client/server.
// - Số từ <input type="number"> là string -> z.coerce.number() (không z.number()).
// - List động: useFieldArray({ control, name: "items" }) thay tự quản mảng.
// - Component UI ngoài (select shadcn/datepicker): <Controller control render={({ field }) => ...} />.
```

Bản RHF + Zod đầy đủ (copy vào prod):

```tsx
// RHF + Zod (prod) — cài `npm i react-hook-form zod @hookform/resolvers`
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 1 schema = nguồn sự thật: validate + suy type, tái dùng server
const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
});
type Form = z.infer<typeof Schema>;

export default function Login() {
  // resolver đưa schema vào luồng validate; mode onTouched báo khi blur
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema), mode: "onTouched",
  });
  return (
    <form onSubmit={handleSubmit((d) => alert(JSON.stringify(d)))}>
      <input {...register("email")} placeholder="Email" aria-label="Email" />
      {errors.email && <small role="alert">{errors.email.message}</small>}
      <input type="password" {...register("pass")} placeholder="Mật khẩu" aria-label="Mật khẩu" />
      {errors.pass && <small role="alert">{errors.pass.message}</small>}
      <button disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Login"}</button>
    </form>
  );
}
```

List động + Controller (form phức tạp):

```tsx
// useFieldArray cho dòng sản phẩm động — schema mảng validate theo
import { useFieldArray } from "react-hook-form";
const { fields, append, remove } = useFieldArray({ control, name: "items" });
// fields.map((f, i) => <input {...register(`items.${i}.name`)} />) + nút append({ name: "", price: 0 })

// Controller cho component ngoài không phải input (select shadcn, datepicker):
import { Controller } from "react-hook-form";
<Controller control={control} name="country" render={({ field }) => (
  <Select value={field.value} onValueChange={field.onChange} />
)} />
```

## Giải thích từng phần
- Dòng `e.preventDefault()`: bắt buộc đầu submit. Vì sao? Vì `<form>` mặc định GET + reload trang (hành vi HTML từ 1990). Không chặn là React unmount, state mất, user tưởng "bấm login trắng trang". Mọi `handleSubmit` RHF đã chặn giúp bạn.
- Dòng `if (submitting) return`: chặn submit kép khi API chậm. Vì sao? Vì user bấm 3 lần là 3 request trùng (trùng đơn hàng). RHF cho `isSubmitting` để `disabled` nút — cùng ý, khỏi state tay.
- Hai dòng validate `includes("@")` / `length < 6`: fail-fast — return ngay lỗi đầu. Vì sao fail-fast? Vì báo 1 lỗi rõ hơn báo 5 lỗi cùng lúc với form login. Form lớn (10 field) thì validate tay phình (10 if + 10 err state) — đó là tín hiệu chuyển RHF + schema.
- Dòng `setTimeout(... reset ...)`: giả lập API async. `setEmail("")` reset tay; RHF `reset()` reset hết + xóa errors + về `defaultValues`. Quên reset là form giữ dữ liệu cũ sau submit thành công — user tưởng chưa gửi, bấm lại.
- Dòng `<input value={email} onChange={...}>`: controlled — mỗi phím re-render. Vì sao `aria-label`? Vừa a11y (screen reader) vừa cho test `getByLabelText`/`getByRole` (DAY 21) bền hơn query class.
- Dòng `{err && <p role="alert">}`: lỗi tổng demo. `role="alert"` để screen reader đọc ngay khi lỗi xuất hiện. RHF tiến một bước: lỗi theo field (`errors.email.message`) cạnh đúng input sai — user biết sửa chỗ nào.
- Dòng `<button type="submit" disabled={submitting}>`: `type="submit"` để Enter trong input cũng submit (không có là chỉ click mới gửi). `disabled` khi gửi + text "Đang gửi..." cho phản hồi. RHF: `disabled={isSubmitting}` tương đương.
- Dòng `{...register("email")}`: "formControlName" của RHF — spread `{ name, onChange, onBlur, ref }`. Vì sao không `value`? Vì RHF uncontrolled: value ở DOM, `ref` để đọc khi cần. Gõ 100 phím → 0 re-render form (chỉ blur/submit mới render lỗi).
- Dòng `handleSubmit((d) => ...)`: bọc 3 việc (chặn reload, chạy resolver, chỉ gọi khi sạch) + type `d: Form` từ `z.infer`. Không cần cast, không `any`.
- Dòng `z.coerce.number()`: bẫy số 1 — `<input type="number">` trả string `"20"`, `z.number()` fail. `coerce` tự `"20" → 20` trước khi check `.min(0)`.
- Dòng `useFieldArray`/`Controller`: khi form có list động (thêm dòng sản phẩm) hoặc component ngoài (select shadcn không phải `<input>`), tự quản tay rất rối (key, register theo index, unmount). Hai API này sinh để giải quyết đúng 2 ca đó.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `FormsModule` + `[(ngModel)]` (template-driven) | controlled `useState` (`value` + `onChange`) | Cùng single source of truth, khác cú pháp |
| `ReactiveForms` `FormGroup`/`FormControl` + `Validators` | `useForm<T>()` + Zod schema | Không class FormGroup — object values + schema + mode |
| `Validators.required`/`email`/`minLength` | `z.string().email()`/`.min()`/`.regex()`/`refine` | Zod mạnh hơn (coerce, cross-field, pick/extend) |
| `formControlName="email"` | `{...register("email")}` | Spread từ RHF (gồm ref để uncontrolled) |
| `errors['email']` | `formState.errors.email?.message` | Cùng đọc lỗi theo field, message từ schema |
| `form.valueChanges` (RxJS) | `watch("email")` (RHF) | Stream ↔ lightweight subscription; watch chỉ khi cần UI live |
| Async validator (server check) | `z.refine(async ...)` / resolver async | Await server trong schema |
| `FormArray` (list động) | `useFieldArray({ control, name })` | Thêm/xóa dòng + schema mảng |
| Component ngoài (`mat-select`) | `Controller` bọc (select shadcn/datepicker) | Cầu nối controlled ngoài vào RHF |
| `ngSubmit` | `onSubmit={handleSubmit(...)}` (đã preventDefault) | Cùng chặn reload, khác nơi làm |
| `form.valid` disable nút | `formState.isValid`/`isSubmitting` disable | Cùng ý, RHF có sẵn không cần tính tay |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên `type="submit"` / quên `preventDefault`
```tsx
// ❌ SAI: nút mặc định type="submit" trong form thì ổn, nhưng ngoài form hoặc type="button" là không submit;
// thiếu preventDefault là reload trắng trang
<form onSubmit={(e) => { save(); }}><button>Bấm</button></form> // reload!
```
```tsx
// ✅ ĐÚNG: type rõ + chặn mặc định (RHF handleSubmit đã chặn)
<form onSubmit={(e) => { e.preventDefault(); save(); }}><button type="submit">Login</button></form>
```

### 2. Không reset sau submit
```tsx
// ❌ SAI: giữ dữ liệu cũ — user bấm lại gửi trùng
const submit = () => { alert("OK"); }; // email vẫn đầy
```
```tsx
// ✅ ĐÚNG: reset tay hoặc RHF reset()
setEmail(""); setPass(""); // thuần
reset(); // RHF — về defaultValues + xóa errors
```

### 3. Validate có nhưng không hiện lỗi
Mô tả: `errors` đầy nhưng JSX không render `errors.x?.message` → user không biết sai chỗ nào, cứ bấm. Fix: mỗi input kèm `{errors.field && <small role="alert">{errors.field.message}</small>}` ngay dưới nó.

### 4. `defaultValues` lệch type với schema
```tsx
// ❌ SAI: schema number nhưng default string -> runtime fail validate ngay mở form
const Schema = z.object({ age: z.number() });
useForm({ defaultValues: { age: "20" as any } });
```
```tsx
// ✅ ĐÚNG: Partial<Form> + coerce cho input number
const Schema = z.object({ age: z.coerce.number() });
useForm({ defaultValues: { age: 20 } });
```

### 5. Controlled thuần cho form lớn → lag mỗi phím
Mô tả: 30 field mỗi phím re-render cả form + validate nặng → gõ giật. Fix: chuyển RHF (uncontrolled, gõ không render) hoặc tách field thành component nhỏ `memo` để render cục bộ.

### 6. Không `coerce` cho số
```tsx
// ❌ SAI: input number trả "20" string -> z.number() fail "Expected number"
z.object({ age: z.number() })
```
```tsx
// ✅ ĐÚNG: coerce tự đổi trước khi check
z.object({ age: z.coerce.number().min(0, "Tuổi không âm") })
```

### 7. Submit kép khi API chậm
```tsx
// ❌ SAI: bấm 3 lần 3 request trùng đơn
<button type="submit">Login</button>
```
```tsx
// ✅ ĐÚNG: disable khi đang gửi (tay hoặc RHF isSubmitting)
const [submitting, setSubmitting] = useState(false);
<button type="submit" disabled={submitting}>{submitting ? "Đang gửi..." : "Login"}</button>
```

## Best practices / Mẹo
- **Rule 2026:** <5 field + validate đơn giản → `useState` (như example); lớn/nested/list/cross-field → **RHF + Zod + zodResolver**. Vì sao ngưỡng? Vì dưới 5 field RHF overhead (học API, cài lib) không đáng; trên thì validate tay phình.
- Chia schema theo domain (`authSchema`, `checkoutSchema`), `.extend()` khi cần, `z.infer` làm type API. Vì sao? Để 1 schema dùng client + server + docs — đổi 1 chỗ đồng bộ.
- `mode: "onTouched"` (blur mới báo) cân bằng báo sớm vs khó chịu. `onChange` báo mỗi phím (ồn), `onSubmit` báo muộn (user không biết sai khi gõ). Vì sao onTouched thắng? Vì user rời field là đã xong ý định, báo lúc đó đúng lúc.
- `Controller` khi dùng component ngoài (select shadcn, datepicker): truyền `control` + `render={({ field }) => ...}`. Vì sao? Vì component ngoài không có `ref` input để `register` — Controller làm cầu.
- `useFieldArray` cho mảng động thay vì tự `useState` mảng + register index tay. Vì sao? Vì key/unmount/register theo index tay dễ lệch, `fields` của RHF giữ `id` ổn định.
- Message lỗi trong schema (Zod), không rải trong JSX. Vì sao? Để dịch/i18n (DAY 18) thay 1 file schema, không sửa 20 file JSX.
- Mọi input có `label`/`aria-label` — vừa a11y vừa cho test `getByRole` bền (DAY 21).

## Bài tập nhỏ
1. Nâng form Login (RHF) lên 4 field (`name`, `email`, `pass`, `confirmPass`) với `.refine(confirm === pass)` — hiện lỗi từng field. Vì sao refine cần `path: ["confirm"]`?
2. Dùng `useFieldArray` làm form "thêm dòng sản phẩm": nút Thêm dòng, mỗi dòng `name` + `price` (`z.coerce.number()`); submit in JSON. Kiểm tra xóa dòng giữa không lệch các dòng còn lại (nhờ `field.id`).
3. Bọc select shadcn bằng `Controller` — so sánh với `{...register}` cho input thường: khác gì (ref vs value/onChange)?
4. Đổi `mode` giữa `onChange`/`onTouched`/`onSubmit` và ghi cảm nhận báo lỗi. Khi nào mỗi mode hợp?
5. Thêm `isSubmitting` disable + test bấm kép (bấm 3 lần nhanh chỉ 1 request). Không có là trùng request thế nào?

## Reference
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react-hook-form.com/
- https://zod.dev/
- https://github.com/react-hook-form/resolvers
