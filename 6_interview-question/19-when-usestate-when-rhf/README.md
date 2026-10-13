# Q19: Form login 2 ô thì em dùng `useState` hay lôi react-hook-form vào? Ranh giới ở đâu?

## Câu hỏi

> Có phải form nào cũng nên lôi react-hook-form (RHF) vào không?
> Form cỡ nào thì RHF đáng tiền, cỡ nào thì `useState` thuần là đủ?
> Dấu hiệu nào cho thấy bạn đang để `useState` vượt tải?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Quy tắc thực chiến**:
  - **Form 1–3 field, rule đơn giản, không validate chéo** → **`useState` thuần** (Q17 controlled pattern): 0 dependency, đọc hiểu ngay, debug trực tiếp.
  - **Form nhiều field (≥5), rule phức tạp (validate chéo, async, field động), hoặc form lặp lại nhiều nơi** → **RHF + Zod**: ít re-render (uncontrolled + ref), lỗi theo field có sẵn, schema tái dùng (client + server).
- **Dấu hiệu `useState` VƯỢT TẢI** (thời điểm chuyển RHF):
  1. Bạn phải tạo **n state + n setter** (một state mỗi field, kèm cờ lỗi từng field, cờ submitting).
  2. **Validate tay bằng `if` lồng nhau**, lỗi dồn vào một `err` chung rồi tự phân rã ra từng field.
  3. **Cùng rule** xuất hiện ở **nhiều form** (duplicating).
  4. Form **nhiều field + mỗi phím gõ gây lag** (controlled re-render).
- **Điểm ăn điểm**: quyết định dựa trên **phức tạp validate + số field + hiệu năng**, KHÔNG phải "RHF luôn xịn hơn". Form đăng nhập 2 field với RHF = **overkill** (thêm lib, thêm khái niệm `register`/`mode` không cần thiết).

## Trả lời chi tiết

### 1. Bảng "khi nào gì" (1 trang)

| Dấu hiệu | Dùng gì | Ví dụ |
|---|---|---|
| 1–3 field, rule đơn giản (required, email) | **`useState` + validate tay** | Form đăng nhập, form đặt lại mật khẩu |
| Cần ghi giá trị "tinh tế" (mask SDT, format tiền khi gõ, derive 1 field từ field khác trực tiếp) | **`useState`** (controlled) — RHF làm việc này qua `watch` + `setValue` được nhưng **nặng hơn khi chỉ cần ít field** | Form "số điện thoại tự chèn dấu cách mỗi 3 số" (1–2 field) |
| **≥5 field** + rule phức tạp / validate chéo / async | **RHF + Zod** | Đăng ký (5–10 field, confirm password, check email tồn tại = async), form admin |
| **Field động** (thêm/xóa dòng — list input) | **RHF `useFieldArray`** | Form "thêm nhiều thẻ tín dụng", "thêm người nhận" |
| **Form xuất hiện N nơi** (login nhiều trang) | **RHF + Zod** (schema chia sẻ 1 lần) | 1 schema dùng ở 3 page — đổi rule chỉ 1 chỗ |
| **Nhiều field + mỗi phím gõ gây lag** (form dài) | **RHF** (uncontrolled — không re-render mỗi phím) | Form 30 field input nặng |

### 2. Dấu hiệu "vượt tải" của `useState` (check-list thực chiến)

```tsx
// ❌ Tín hiệu nên dừng lại và chuyển RHF khi thấy code đi về phía này:
const [email, setEmail] = useState("");
const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [pass, setPass] = useState("");
const [confirm, setConfirm] = useState("");
const [emailErr, setEmailErr] = useState("");
const [passErr, setPassErr] = useState("");
const [confirmErr, setConfirmErr] = useState("");
const [submitting, setSubmitting] = useState(false);

const submit = (e) => {
  e.preventDefault();
  // if lồng nhau, fail-fast tay — phình theo mỗi rule:
  if (!name) { setNameErr("Tên bắt buộc"); return; }
  if (!email.includes("@")) { setEmailErr("Email sai"); return; }
  if (pass.length < 6) { setPassErr("Tối thiểu 6 ký tự"); return; }
  if (pass !== confirm) { setConfirmErr("Không khớp"); return; }
  // ...
};
```

**Bốn mốc chuyển RHF** (ghi nhớ):

1. **N state + N setter cho N field** (chưa tính cờ lỗi, submitting) → **đếm state quá 10 dòng ở đầu form** = tín hiệu.
2. **Validate `if` lồng nhau / fail-fast thủ công** → mỗi rule mới thêm một nút rẽ if.
3. **Cùng rule lặp ở nhiều form** → viết một schema Zod chạy mọi nơi (client + server chia sẻ code).
4. **Lag khi gõ (form dài)** → controlled mỗi phím render (Q17) → RHF uncontrolled giải quyết.

**RHF + Zod biến toàn bộ nói trên thành:**

```tsx
const Schema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
  confirm: z.string(),
}).refine((d) => d.pass === d.confirm, { message: "Mật khẩu không khớp", path: ["confirm"] });

function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), mode: "onTouched" });

  return (
    <form onSubmit={handleSubmit((d) => /* d: type đã inference */)}>
      <input {...register("name")} />
      {errors.name && <small>{errors.name.message}</small>}
      {/* ... các field còn lại — KHÔNG có N state, N setter, N if lồng nhau */}
      <button disabled={isSubmitting}>Đăng ký</button>
    </form>
  );
}
```

**Đổi từ 10 state + 5 if còn 1 schema + 1 `useForm`** — rule ở 1 chỗ, type đồng bộ (z.infer), lỗi theo field tự (không phân rã thủ công).

### 3. Trích từ question-answer DAY 11 (nén lại để trả lời nhanh)

- **Form nhỏ (1–3 field, rule đơn giản)** → `useState` (ít dependency, đọc hiểu ngay).
- **Form phức tạp (nhiều field, rule chéo, async, field động)** → RHF + Zod (ít re-render, lỗi theo field có sẵn, schema tái dùng).
- **Dấu hiệu validate tay quá tải**: `err` trở thành object nhiều field, `if` lồng nhau, rule lặp nhiều form.

### 4. Hai trường hợp dễ lẫn (bắt thêm)

- **Chỉ cần ghi giá trị (1–3 field) nhưng muốn validate live** (hiện lỗi ngay khi gõ) → vẫn được với `useState` (validate tính derived mỗi render: `email.includes("@") ? null : "..."`) — không cần RHF. RHF phát huy khi **nhiều field + nhiều rule**.
- **Đã dùng RHF nhưng form cực đơn giản (1 field)** → đánh giá lại: liệu chi phí lib (bundle + học `register`/`mode`) đáng không? — 1 field = `useState` đơn giản hơn hết (trừ khi schema đã cần cho server — lúc đó Zod vẫn đáng).

### 5. Đối chiếu Angular (điểm ăn điểm)

| Angular | React | Ghi chú |
|---|---|---|
| `FormsModule` (template-driven, `ngModel`) | **`useState` controlled (Q17)** | Cùng mức đơn giản (1 field 1 binding) |
| `ReactiveForms` (`FormGroup`, `FormControl`) | **RHF + Zod** | Cùng mức phức tạp (nhiều field + validate) — RHF gọn hơn (không class) |

> **Nói đúng câu chốt**: Angular có 2 engine forms sẵn (template-driven + reactive); React không có engine forms trong core (Q1) — nên quyết định là bạn tự chọn: nguyên tắc state (useState ≈ template-driven) hay lib (RHF ≈ reactive). Chuẩn mực 2026 cho form nặng là **RHF + Zod**.

## Bẫy khi phỏng vấn

1. **"RHF xịn hơn controlled — dùng mọi form"** → **sai**: form nhỏ, RHF = overkill (thêm lib + khái niệm). Quy tắc = số field + độ phức tạp rule + hiệu năng.
2. **"Nói RHF = uncontrolled nên mất single source of truth"** → **sai** (xem Q18 §1): RHF vẫn một nguồn sự thật khi submit (giá trị DOM là chính); chỉ lưu tạm khác địa điểm (DOM thay vì state) để ít re-render.
3. **Đã có nhiều rule cần chia sẻ client + server nhưng vẫn viết validate rời ở nhiều nơi** → **dùng Zod schema một chỗ** (mạnh hơn chỉ đổi lib form — vì schema là giá trị thật: rule chung).
4. **"Field động (thêm/xóa dòng) mà viết tay"** (mảng `useState` + map + index) → **RHF `useFieldArray`** (quản lý key + giá trị + xóa dòng); viết tay dễ sai state khi xóa giữa list (liên hệ bẫy key/index Q8).
5. **Form chỉ có 1 field nhưng muốn validate nặng (async check email tồn tại, rate limit)** → không quyết chỉ dựa vào số field — async validation nặng cũng chỉ ra RHF (`z.refine(async ...)`); hoặc `useState` + `useEffect` nếu chỉ 1 field.

## Gợi ý câu chốt

> "Quy tắc khi nào gì: **form 1–3 field, rule đơn giản → `useState` thuần (0 lib, debug trực tiếp); form ≥5 field, rule chéo/async/field động, hoặc rule cần chia sẻ client+server → RHF + Zod**. Dấu hiệu vượt tải useState: **N state + N setter**, `if` validate lồng nhau, rule lặp nhiều form, hoặc lag mỗi phím gõ (controlled re-render). Không phải 'RHF luôn xịn hơn' — quyết định dựa trên **phức tạp + hiệu năng**, không phải 'càng nhiều lib càng tốt'."

## Reference

- [`3_react-tutorial/11-forms`](../../3_react-tutorial/11-forms) — Quyết định kiến trúc (useState vs RHF khi nào), dấu hiệu validate tay quá tải
- [`3_react-tutorial/11-forms/question-answer.md`](../../3_react-tutorial/11-forms/question-answer.md) — Q4 "Khi nào useState khi nào RHF + Zod" (nguyên văn)
- Q17 (Controlled form) — pattern đúng cho form nhỏ
- Q18 (RHF khác controlled) — cơ chế register + Zod
- Q8 (key = index) — bẫy tương tự khi viết field động thủ công bằng mảng

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q17 — useState controlled form?](../17-controlled-form/README.md) · [Q18 — RHF giải quyết gì mà useState không tốt?](../18-rhf-vs-controlled/README.md)
- **Đào sâu (xuyên nhóm)**: [Q28 — dấu hiệu "state vượt tải" thì chuyển useReducer?](../28-usereducer-vs-usestate/README.md) · [Q35 — typing form (Zod, discriminated union cho state)?](../35-type-safety/README.md)
