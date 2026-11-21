# DAY 11: FORMS (REACTIVE & TEMPLATE-DRIVEN)

Form là nơi người dùng "chạm" vào app nhiều nhất — và cũng là nơi dễ bug nhất. DAY 11 dạy bạn làm form React từ controlled thuần (hiểu cơ chế) đến bộ ba chuẩn 2026 RHF + Zod (dùng cho form thật), kèm bản đồ dịch từ Angular Forms.

## Mục tiêu bài học

Mục này nêu 3 đích của DAY 11. Đọc để biết cuối bài bạn làm được gì.

- Nắm tư duy form React: **controlled input** (state là nguồn duy nhất) thay cho `FormsModule` + `ngModel`, và cách tự viết validate.
- Làm chủ bộ ba chuẩn 2026: **react-hook-form (RHF) + Zod + zodResolver** — tương đương Reactive Forms + Validators của Angular nhưng gọn nhẹ hơn.
- Biết quyết định: form nhỏ → `useState`; form phức tạp/validate mạnh → RHF + Zod.

> **Tóm gọn 1 câu:** Cuối DAY 11 bạn làm được form ở cả hai "cấp độ": tự tay với `useState` cho form nhỏ, và RHF + Zod cho form thật — cùng biết chọn lúc nào dùng cấp nào.

## Khái niệm cốt lõi (Core)

Mục này định nghĩa 6 khái niệm từ controlled đến đối chiếu Angular. Đọc tuần tự — controlled/uncontrolled là nền cho mọi thứ sau.

### 1. Controlled input — state là nguồn duy nhất
`<input value={state} onChange={e => setState(e.target.value)} />`: chữ gõ vào đi vào state, state vẽ lại input. Đã học DAY 1, giờ vận dụng cho form thật với submit + validate + lỗi.

> 📄 **Code ví dụ:** [`examples/01-1-controlled-input-state-la-nguon-duy-nhat.tsx`](examples/01-1-controlled-input-state-la-nguon-duy-nhat.tsx)

Vì sao single source of truth? Vì muốn biết form hiện gì, validate gì, disable nút không — chỉ nhìn state. Không có chuyện DOM giữ một giá trị, state giữ giá trị khác. Giá phải trả: mỗi phím là một `setState` + re-render form. Form 2-3 field không sao; form 30 field + validate nặng mỗi phím thì lag — đó là lúc RHF uncontrolled phát huy (mục 3). Ví von: controlled form như **thu ngân ghi sổ mỗi món khách gọi** — sổ luôn đúng, nhưng quán đông (form lớn) thì ghi tay kịp không?

### 2. Uncontrolled input — DOM giữ, đọc khi cần
Dùng `ref`/`defaultValue`, React không kiểm soát mỗi phím. Ít dùng cho form tay, nhưng RHF tận dụng để **giảm re-render**: value nằm ở DOM/ref nội bộ RHF, chỉ submit/blur mới đọc + validate + re-render lỗi.

> 📄 **Code ví dụ:** [`examples/02-2-uncontrolled-input-dom-giu-oc-khi-can.tsx`](examples/02-2-uncontrolled-input-dom-giu-oc-khi-can.tsx)

Vì sao controlled vẫn mặc định? Vì uncontrolled khó validate live (hiện lỗi khi gõ), khó disable nút theo input, khó format live. Chỉ chuyển uncontrolled (qua RHF, không phải tay) khi đo được controlled lag.

### 3. react-hook-form — `useForm` + `register`, ít re-render nhờ ref
`useForm<T>()` tạo form; `{...register("email")}` spread `{ name, onChange, onBlur, ref }` vào input để RHF "đăng ký" field. Không cần `value` từ state → gõ không re-render. Validate qua resolver, lỗi vào `formState.errors`.

> 📄 **Code ví dụ:** [`examples/03-3-react-hook-form-useform-register-it-re.tsx`](examples/03-3-react-hook-form-useform-register-it-re.tsx)

Vì sao spread `{...register("email")}` mà không `value`/`onChange` tay? Vì RHF cần gắn `ref` (đọc DOM) + `onChange`/`onBlur` nội bộ (ghi vào store RHF + trigger validate). Bạn chỉ quyết tên field (`"email"`) và nơi hiện lỗi. `handleSubmit` bọc: chặn reload mặc định, chạy resolver, chỉ gọi callback khi sạch lỗi với `data: Form` đúng kiểu.

### 4. Zod — schema là nguồn sự thật cho validate + type
Define 1 schema runtime, suy type `z.infer`, tái dùng client/server/shared package. `zodResolver` cắm vào RHF. Mạnh hơn `Validators` Angular (regex, refine cross-field, coerce, pick/extend).

> 📄 **Code ví dụ:** [`examples/04-4-zod-schema-la-nguon-su-that-cho.tsx`](examples/04-4-zod-schema-la-nguon-su-that-cho.tsx)

Vì sao message trong schema? Vì thay đổi 1 chỗ, đồng bộ client + server + docs. Vì sao `z.infer`? Vì không viết type 2 lần (schema + interface) rồi lệch nhau. Hãy hình dung schema Zod như **quy chuẩn chất lượng in trên khuôn** — khuôn (schema) một bản, mọi sản phẩm (client, server, type) đều ra từ khuôn đó nên không thể lệch nhau.

### 5. `formState.errors` — bản đồ lỗi theo field
`errors.email?.message` hiện cạnh input đó. Lỗi từ resolver (Zod) nên đúng message bạn viết trong schema. Kết hợp `mode: "onTouched"` để blur mới báo (không báo đỏ ngay khi mở form), submit luôn validate hết. `formState.errors` giống **bản đồ phạt lỗi in sẵn theo từng ô** — nhìn ô nào là biết ô đó sai gì, không phải đoán.

### 6. Đối chiếu Angular
`FormControl` + `Validators.required/email` ↔ RHF + Zod (`z.string().email()`); `formControlName="email"` ↔ `{...register("email")}`; `errors['email']` ↔ `formState.errors.email`; `valueChanges` ↔ `watch("email")`; async validator ↔ `z.refine(async ...)`; `FormArray` ↔ `useFieldArray`; `setValidators` động ↔ schema khác theo bước. RHF không có class FormGroup — "form" là object values + schema + mode.

### Keyword chính
controlled (`value` + `onChange`), uncontrolled (`ref`/`defaultValue`), `react-hook-form` (`useForm`, `register`, `handleSubmit`, `watch`, `reset`, `useFieldArray`, `Controller`), Zod (`z.object`, `z.infer`, `zodResolver`, `refine`, `coerce`), `formState.errors/isSubmitting`, submit flow (`preventDefault`).

> **Tóm gọn 1 câu:** Sáu khái niệm xếp thành chuỗi: controlled cho hiểu, uncontrolled cho nhẹ, RHF + Zod cho chuẩn — lỗi hiện theo field, và Angular có "twin" cho từng mảnh.

## Luồng hoạt động (Flow)

Mục này đi qua 9 bước vận hành cả hai bản (thuần + RHF). Đọc để thấy khác biệt re-render giữa hai cách diễn ra như thế nào trong thực tế.
1. Mount bản thuần: `useState("")` cho email/pass/err/submitting. Render 2 input controlled + nút `type="submit"`.
2. User gõ "a": `onChange` → `setEmail("a")` → re-render → input hiện "a". Mỗi phím một vòng (khác RHF không render).
3. User bấm Login/Enter: `onSubmit` fire → `e.preventDefault()` chặn reload (không có dòng này là trang trắng, state mất).
4. Validate tay fail-fast: `if (!email.includes("@")) return setErr(...)` — dừng ngay lỗi đầu, không check tiếp. `submitting` chặn bấm kép.
5. Lỗi → `setErr` → re-render hiện `<p role="alert">` đỏ. Đúng → `setErr("")`, `setSubmitting(true)`, giả lập API 500ms, `alert`, reset tay 2 field, `setSubmitting(false)`.
6. Bản RHF: `useForm({ resolver })` mount; `register("email")` spread `{ name, onChange, onBlur, ref }` vào input — RHF đăng ký field (uncontrolled, value ở DOM).
7. User gõ: value lưu ở DOM/ref RHF — **không setState mỗi phím** → không re-render form. Blur (mode onTouched) thì validate field đó → lỗi vào `errors`.
8. Submit: `handleSubmit(cb)` chặn mặc định, chạy `zodResolver` trên toàn bộ values. Lỗi → `errors` đầy → re-render hiện `<small>` cạnh từng field. Sạch → `cb(data: Form)` với type `z.infer` — gọi API/navigate.
9. List động: `useFieldArray({ control, name: "items" })` cho thêm/xóa dòng (`append`/`remove`) mà schema mảng Zod validate theo. Component ngoài (select shadcn): `<Controller control name render={({ field }) => <Select {...field} />} />`.

> **Tóm gọn 1 câu:** 9 bước là hai câu chuyện song song: bản thuần re-render mỗi phím, bản RHF im lặng đến khi blur/submit — cùng một form, hai mức tối ưu.

## Ví dụ chi tiết

Mục này trỏ tới 3 file ví dụ: bản thuần, bản RHF + Zod, và form phức tạp. Đọc theo trật tự đó để tiến dần từ cơ bản đến "copy vào prod được".

Khớp 1-1 với `example.tsx` (controlled thuần + submitting + reset):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

Bản RHF + Zod đầy đủ (copy vào prod):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

List động + Controller (form phức tạp):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

> **Tóm gọn 1 câu:** Ba file ví dụ là ba cấp độ: controlled thuần để hiểu, RHF + Zod để dùng thật, list động + Controller cho form khó.

## Giải thích từng phần

Mục này bóc từng dòng code kèm "vì sao". Đọc khi cần hiểu sâu từng quyết định trong ví dụ trước khi chỉnh theo dự án của mình.
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

> **Tóm gọn 1 câu:** Mỗi dòng là một "vì sao": `preventDefault` giữ state, `isSubmitting` chặn đua, `coerce` nối string với number, `register`/`Controller`/`useFieldArray` gánh ba ca khó của RHF.

## Bảng so sánh Angular ↔ React

Mục này là từ điển dịch Angular Forms sang React cho 11 khái niệm. Đọc khi quen Angular và cần "đổi tư duy" từng mảnh một.

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

> **Cách đọc bảng này:** mỗi dòng là một khái niệm Angular với "twin" React tương ứng — cột Angular để nhận diện điều bạn cần, cột React là cách viết, cột Ghi chú nêu khác biệt cốt lõi (thường là "không có class, chỉ còn object + schema").

## Lỗi thường gặp (Common pitfalls)

Mục này liệt kê 7 lỗi form kinh điển, mỗi lỗi có file ví dụ chạy được. Đọc để né các bug ẩn tiếng hay gây trắng trang và trùng request.

### 1. Quên `type="submit"` / quên `preventDefault`
> 📄 **Code ví dụ:** [`examples/08-1-quen-type-submit-quen-preventdefault.tsx`](examples/08-1-quen-type-submit-quen-preventdefault.tsx)
> 📄 **Code ví dụ:** [`examples/09-1-quen-type-submit-quen-preventdefault.tsx`](examples/09-1-quen-type-submit-quen-preventdefault.tsx)

### 2. Không reset sau submit
> 📄 **Code ví dụ:** [`examples/10-2-khong-reset-sau-submit.tsx`](examples/10-2-khong-reset-sau-submit.tsx)
> 📄 **Code ví dụ:** [`examples/11-2-khong-reset-sau-submit.tsx`](examples/11-2-khong-reset-sau-submit.tsx)

### 3. Validate có nhưng không hiện lỗi
Mô tả: `errors` đầy nhưng JSX không render `errors.x?.message` → user không biết sai chỗ nào, cứ bấm. Fix: mỗi input kèm `{errors.field && <small role="alert">{errors.field.message}</small>}` ngay dưới nó.

### 4. `defaultValues` lệch type với schema
> 📄 **Code ví dụ:** [`examples/12-4-defaultvalues-lech-type-voi-schema.tsx`](examples/12-4-defaultvalues-lech-type-voi-schema.tsx)
> 📄 **Code ví dụ:** [`examples/13-4-defaultvalues-lech-type-voi-schema.tsx`](examples/13-4-defaultvalues-lech-type-voi-schema.tsx)

### 5. Controlled thuần cho form lớn → lag mỗi phím
Mô tả: 30 field mỗi phím re-render cả form + validate nặng → gõ giật. Fix: chuyển RHF (uncontrolled, gõ không render) hoặc tách field thành component nhỏ `memo` để render cục bộ.

### 6. Không `coerce` cho số
> 📄 **Code ví dụ:** [`examples/14-6-khong-coerce-cho-so.tsx`](examples/14-6-khong-coerce-cho-so.tsx)
> 📄 **Code ví dụ:** [`examples/15-6-khong-coerce-cho-so.tsx`](examples/15-6-khong-coerce-cho-so.tsx)

### 7. Submit kép khi API chậm
> 📄 **Code ví dụ:** [`examples/16-7-submit-kep-khi-api-cham.tsx`](examples/16-7-submit-kep-khi-api-cham.tsx)
> 📄 **Code ví dụ:** [`examples/17-7-submit-kep-khi-api-cham.tsx`](examples/17-7-submit-kep-khi-api-cham.tsx)

> **Tóm gọn 1 câu:** Bảy lỗi rơi vào ba nhóm: quên hành vi mặc định HTML (reload), quên phản hồi cho user (reset, hiện lỗi), và lệch kiểu dữ liệu/timing (coerce, submit kép).

## Best practices / Mẹo

Mục này chốt 7 mẹo chọn công cụ và viết form bền. Đọc để có bộ quy tắc nhớ được khi làm form thật.
- **Rule 2026:** <5 field + validate đơn giản → `useState` (như example); lớn/nested/list/cross-field → **RHF + Zod + zodResolver**. Vì sao ngưỡng? Vì dưới 5 field RHF overhead (học API, cài lib) không đáng; trên thì validate tay phình.
- Chia schema theo domain (`authSchema`, `checkoutSchema`), `.extend()` khi cần, `z.infer` làm type API. Vì sao? Để 1 schema dùng client + server + docs — đổi 1 chỗ đồng bộ.
- `mode: "onTouched"` (blur mới báo) cân bằng báo sớm vs khó chịu. `onChange` báo mỗi phím (ồn), `onSubmit` báo muộn (user không biết sai khi gõ). Vì sao onTouched thắng? Vì user rời field là đã xong ý định, báo lúc đó đúng lúc.
- `Controller` khi dùng component ngoài (select shadcn, datepicker): truyền `control` + `render={({ field }) => ...}`. Vì sao? Vì component ngoài không có `ref` input để `register` — Controller làm cầu.
- `useFieldArray` cho mảng động thay vì tự `useState` mảng + register index tay. Vì sao? Vì key/unmount/register theo index tay dễ lệch, `fields` của RHF giữ `id` ổn định.
- Message lỗi trong schema (Zod), không rải trong JSX. Vì sao? Để dịch/i18n (DAY 18) thay 1 file schema, không sửa 20 file JSX.
- Mọi input có `label`/`aria-label` — vừa a11y vừa cho test `getByRole` bền (DAY 21).

> **Tóm gọn 1 câu:** Mẹo chốt: ngưỡng 5 field chia hai thế giới `useState` vs RHF + Zod, schema là nguồn sự thật duy nhất, và `onTouched` là mode mặc định đáng tin.

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
