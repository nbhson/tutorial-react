# DAY 11 — Hỏi & Đáp: Forms

> File hỏi–đáp chi tiết cho `3_react-tutorial/11-forms`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (controlled form thuần chạy được).

---

## 1. Controlled form thuần hoạt động thế nào?

**Hỏi:** Example không dùng lib mà vẫn login được — luồng dữ liệu ra sao?

**Đáp:**
- Mỗi input là controlled (DAY 1): `value={email} + onChange={setEmail}` — chữ gõ vào state,
  state render lại input. Submit đọc state (đang đồng bộ sẵn), validate tay từng điều kiện,
  lỗi dồn vào `err` hiện dưới form.
- `e.preventDefault()` chặn reload trang mặc định của `<form>` — quên là mất hết state.
- Đủ cho form 2–3 field. Từ ~5 field + rule phức tạp trở lên, validate tay phình nhanh —
  lúc đó sang RHF + Zod.

---

## 2. react-hook-form (RHF) khác controlled thuần ở đâu?

**Hỏi:** `useForm` + `register` giải quyết vấn đề gì của cách tay?

**Đáp:**
- Controlled thuần **setState mỗi phím gõ** → re-render cả form mỗi ký tự. RHF dùng
  **uncontrolled + ref-based**: value nằm trong DOM/ref của RHF, gõ không re-render —
  chỉ re-render khi hiện lỗi hoặc submit.
- `register("email")` trả `{ name, onChange, onBlur, ref }`, spread vào input là RHF "đăng ký" field đó.
  Không có class `FormGroup` — "form" chỉ là object + schema.
- Tương đương: `FormControl` + `Validators` ↔ RHF + Zod; `formControlName` ↔ `{...register("email")}`.

---

## 3. Zod + `zodResolver` + `z.infer` là bộ ba gì?

**Hỏi:** Mỗi mảnh trong combo chuẩn 2026 làm gì?

**Đáp:**
- **Zod** — schema validation runtime: define 1 lần (email, min length...), tái dùng cho cả API/server/shared package.
- **`zodResolver`** — cắm schema vào RHF: `handleSubmit` chạy validate trước callback; lỗi vào `formState.errors`.
- **`z.infer<typeof Schema>`** — suy type TS từ schema: callback nhận `data` đã đúng kiểu, không khai type tay 2 lần.
- Hiển thị lỗi cạnh field: `{errors.email?.message}` ngay dưới input tương ứng.

---

## 4. Khi nào `useState`, khi nào RHF + Zod?

**Hỏi:** Form nào cũng lôi RHF vào à?

**Đáp:**
- **Form nhỏ (1–3 field, rule đơn giản)** → `useState` như example: ít dependency, đọc hiểu ngay.
- **Form phức tạp (nhiều field, rule chéo, async validate, field động)** → RHF + Zod: ít re-render,
  lỗi theo field có sẵn, schema tái dùng.
- Dấu hiệu validate tay đang quá tải: `err` thành object nhiều field, `if` lồng nhau, rule lặp ở nhiều form.

---

## 5. Uncontrolled trong RHF có mâu thuẫn "controlled là chuẩn" không?

**Hỏi:** DAY 1 bảo controlled là chuẩn, sao RHF lại dùng uncontrolled?

**Đáp:**
- Không mâu thuẫn — khác tầng tối ưu. Controlled là **mô hình dữ liệu đúng** (single source of truth khi submit).
  RHF vẫn đảm bảo điều đó lúc `handleSubmit`, chỉ là **lưu tạm trong DOM** thay vì state để tránh re-render
  từng phím — tối ưu hiệu năng, không thay đổi ngữ nghĩa form.
- Hiểu nôm na: controlled thuần = "ghi sổ mỗi chữ gõ", RHF = "ghi nháp trên giấy, nộp bài mới chấm".

---

## 6. So nhanh Angular Forms ↔ React?

**Hỏi:** Từng khái niệm FormsModule tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `FormsModule` + `ngModel` | controlled `value` + `onChange` | Tách 2 chiều thành 1 chiều + event |
| Reactive `FormControl` + `Validators` | RHF + Zod | Không class FormGroup |
| `formControlName` | `{...register("email")}` | Đăng ký field |
| `(ngSubmit)` | `onSubmit={handleSubmit(cb)}` + `preventDefault` | Validate trước callback |
| Lỗi theo control | `formState.errors` | `{errors.email?.message}` |

---

## 7. `Controller` để làm gì? Khi nào `register` không đủ?

**Hỏi:** Input UI lib (shadcn Select, DatePicker) không phải `<input>` thì đăng ký RHF kiểu gì?

**Đáp:**
- `register("email")` chỉ làm việc với element có `ref` + `onChange` chuẩn DOM (spread là xong). Component UI lib tự quản value bên trong (`<Select value onValueChange>`, DatePicker) — không có `ref` để RHF bám, spread `register` vào là trật.
- Cơ chế `Controller`: RHF giữ `control` (bộ não form), `Controller` làm cầu — nhận `name` + `control` + `render({ field })`, rồi bạn cắm `field.value`/`field.onChange` vào đúng prop của UI component. Validate Zod vẫn chạy qua `handleSubmit` như thường, `errors` vẫn theo field.
- Quy tắc nhận diện: thấy component nhận `value`/`onValueChange` thay vì `value`/`onChange` + `ref` là biết phải `Controller`. Sai thì sao: spread `register` vào Select thì gõ không vào form, submit thiếu field mà không báo lỗi — vì RHF chưa từng đăng ký được nó.

```tsx
import { useForm, Controller } from "react-hook-form";

// Giả sử CitySelect là component UI lib: nhận value + onValueChange, không có ref
function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Chọn thành phố</option>
      <option value="hcm">TP.HCM</option>
      <option value="hn">Hà Nội</option>
    </select>
  );
}

function AddressForm() {
  const { control, handleSubmit } = useForm<{ city: string }>({ defaultValues: { city: "" } });
  return (
    <form onSubmit={handleSubmit((d) => alert(d.city))}>
      {/* Controller cắm field của RHF vào đúng prop của UI lib */}
      <Controller name="city" control={control} render={({ field }) => (
        <CitySelect value={field.value} onChange={field.onChange} />
      )} />
      <button type="submit">Lưu</button>
    </form>
  );
}
```

---

## 8. `useFieldArray` cho form thêm dòng động (sản phẩm, địa chỉ) thế nào?

**Hỏi:** Form "thêm dòng sản phẩm" mà tự quản mảng `useState` thì thiếu gì?

**Đáp:**
- Tự quản mảng bằng `useState` + `register` tay thì phải tự lo `name` (`items.0.name`), key ổn định, xóa dòng giữa không lệch, validate mảng trong Zod (`z.array(...)`) khớp index — làm tay nhanh lệch, xóa dòng 1 thì lỗi dòng 2 nhảy sai chỗ.
- Cơ chế `useFieldArray({ control, name: "items" })`: RHF cấp `fields` (có `id` ổn định làm key), `append`/`remove`/`move` thao tác mảng trong form state. Mỗi dòng đăng ký `register(`items.${index}.name`)` — index luôn khớp vì RHF tự dồn sau remove. Zod schema mảng validate cả danh sách một lần, lỗi vào `errors.items?.[i]?.price`.
- Sai thì sao: dùng `key={index}` cho dòng động thì xóa dòng giữa, React giữ nhầm DOM/input — giá dòng 2 nhảy lên dòng 1. Fix: luôn `key={f.id}` (id của `useFieldArray`).

```tsx
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema mảng: mỗi dòng có tên + giá dương, ít nhất 1 dòng
const Schema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, "Nhập tên"),
    price: z.coerce.number().positive("Giá phải > 0"),
  })).min(1, "Cần ít nhất 1 dòng"),
});

function OrderForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<{ items: { name: string; price: number }[] }>({
    resolver: zodResolver(Schema), // cắm schema mảng vào RHF
    defaultValues: { items: [{ name: "", price: 0 }] }, // 1 dòng khởi đầu
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" }); // quản mảng động
  return (
    <form onSubmit={handleSubmit((d) => alert(JSON.stringify(d)))}>
      {fields.map((f, i) => (
        <div key={f.id}> {/* key ổn định từ RHF, không dùng index */}
          <input {...register(`items.${i}.name`)} placeholder="Tên SP" />
          <input type="number" {...register(`items.${i}.price`)} placeholder="Giá" />
          <button type="button" onClick={() => remove(i)}>Xóa</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", price: 0 })}>Thêm dòng</button>
      <button type="submit">Đặt hàng</button>
    </form>
  );
}
```

---

## 9. `watch` + `mode: "onTouched"` để làm gì? Khi nào không nên `watch` cả form?

**Hỏi:** Muốn preview "tổng tiền live" theo ô nhập thì đọc form state kiểu gì?

**Đáp:**
- `watch("email")` là cách RHF cho component **đăng ký nghe** giá trị field — mỗi lần field đổi, component re-render để preview. Tương đương `form.valueChanges` subscribe của Angular nhưng lightweight (không RxJS). `mode: "onTouched"` chỉnh thời điểm validate: mặc định `onSubmit` (chỉ báo lỗi khi bấm submit), `onTouched` báo khi user blur khỏi field — cân bằng giữa "báo sớm gây khó chịu" và "báo muộn".
- Cơ chế perf: `watch()` không tham số nghe **cả form** — gõ 1 field re-render cả preview lẫn mọi nơi watch. Chỉ `watch` đúng field cần preview, hoặc bọc preview thành component con riêng để phạm vi re-render gọn.
- Sai thì sao: `watch()` cả form trong component gốc của form 20 field → gõ 1 ký tự re-render 20 field. Fix: `watch("items")` hẹp, hoặc tách `<TotalPreview />` con chỉ watch tổng.

| `mode` | Validate khi nào | Hợp khi nào |
|---|---|---|
| `onSubmit` (mặc định) | Bấm submit mới báo | Form ngắn, muốn ít làm phiền |
| `onTouched` | Blur khỏi field là báo | Khuyên dùng chung — phản hồi vừa đủ |
| `onChange` | Gõ phím nào báo phím đó | Chỉ khi cần gắt (password strength live) |

---

## 10. Lỗi thực chiến: `z.number()` fail với `<input type="number">` + submit trùng khi gọi API?

**Hỏi:** Nhập số đúng mà Zod vẫn báo lỗi, bấm Lưu 2 lần gửi 2 request — vì sao?

**Đáp:**
- Hai lỗi khác nhau nhưng hay gặp cùng form. Thứ nhất: `<input type="number">` trả về **string** (`"12"`), còn `z.number()` đòi number thật — validate fail dù mắt thấy đúng. Fix: `z.coerce.number()` (tự ép string→number trước khi check) hoặc validate string rồi transform. Đây là lỗi #1 khi mang type API (number) vào form (string).
- Thứ hai: user bấm submit 2 lần khi request đang bay → 2 đơn hàng trùng. Fix: đọc `formState.isSubmitting` (RHF tự set true trong lúc `handleSubmit` callback async chạy) để `disabled` nút + đổi nhãn "Đang lưu...". Callback xong (kể cả throw) RHF tự nhả.
- Cơ chế chung: form prod phải tách **kiểu hiển thị** (string trong input) khỏi **kiểu dữ liệu** (number khi submit) — `coerce` là cầu, `isSubmitting` là khóa chống đua.

```tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// coerce: ép string từ input thành number rồi mới check positive
const Schema = z.object({ qty: z.coerce.number().positive("Số lượng phải > 0") });

function BuyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ qty: number }>({
    resolver: zodResolver(Schema),
  });
  return (
    <form onSubmit={handleSubmit(async (d) => {
      await fetch("/api/order", { method: "POST", body: JSON.stringify(d) }); // gọi API thật
    })}>
      <input type="number" {...register("qty")} placeholder="Số lượng" />
      {errors.qty && <small>{errors.qty.message}</small>}
      {/* Khóa nút khi đang gửi: chống double submit */}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : "Mua"}</button>
    </form>
  );
}
```

---

## 11. Validate chéo + async: `confirmPass === pass` và check email tồn tại?

**Hỏi:** Zod kiểm tra 2 field khớp nhau và gọi server check trùng thế nào?

**Đáp:**
- Validate chéo (2 field liên quan) không viết ở từng field mà ở **cả object** bằng `.refine`: nhận toàn bộ data, trả `true/false`, kèm `path` chỉ field nào hiện lỗi. Ví dụ `confirmPass === pass` — refine ở object, `path: ["confirmPass"]` để lỗi hiện dưới ô nhập lại.
- Async (check email đã tồn tại qua API) dùng `z.refine(async ...)` — resolver await được nên `handleSubmit` đợi server trả lời rồi mới quyết định lỗi hay cho submit. Chỉ dùng cho check hiếm (blur/submit), không check mỗi phím (tốn request, cần debounce ở tầng gọi).
- Sai thì sao: viết check chéo trong `validate` của từng field thì không thấy field kia, logic lặp; quên `path` thì lỗi hiện ở root form, user không biết ô nào sai. Fix: chéo → refine object + path; async → refine async + `mode: "onTouched"` để đỡ spam.

```tsx
import { z } from "zod";

// Schema có validate chéo: confirmPass phải khớp pass, lỗi gắn vào confirmPass
const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
  confirmPass: z.string(),
}).refine((d) => d.confirmPass === d.pass, {
  message: "Nhập lại chưa khớp", // thông điệp hiện dưới ô confirmPass
  path: ["confirmPass"], // chỉ rõ field nào nhận lỗi chéo này
});
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 11)
- https://react-hook-form.com/ · https://zod.dev/
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
