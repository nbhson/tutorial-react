# Q17: Em làm ô input mà user gõ chữ gì hiện đúng chữ đó — state với input nối với nhau ra sao?

## Câu hỏi

> Trong form, ô input phải hiện đúng giá trị user gõ — state và input phối hợp với nhau bằng cách nào (controlled input)?
> Khi user gõ một chữ, dữ liệu đi qua mấy bước để input hiện đúng giá trị?
> Quên `e.preventDefault()` ở submit thì chuyện gì xảy ra?
> So với Angular thì controlled trong React khác `ngModel` ở điểm nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Controlled input** = input có **`value` (đọc từ state) + `onChange` (ghi ngược lại state)**: `<input value={email} onChange={e => setEmail(e.target.value)} />`. **State là nguồn sự thật duy nhất** — muốn biết input hiện gì, chỉ nhìn state.
- **Luồng một chiều**: gõ → `onChange` → `setState` → React **re-render** → JSX đánh giá `value` với giá trị mới → DOM cập nhật input.
- Mỗi phím = **một lần `setState` + re-render** (giá phải trả của controlled). Form 2–3 field: không sao. Form 30 field + validate nặng mỗi phím → **lag** (đây là lúc RHF uncontrolled phát huy — xem Q18).
- **`e.preventDefault()` trong `onSubmit` là BẮT BUỘC** (với `<form>` thật): không chặn → trình duyệt reload trang → **mất toàn bộ state** (React unmount). Quên dòng này là bug #1 của người mới.

## Trả lời chi tiết

### 1. Pattern chuẩn (code tối giản)

```tsx
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mật khẩu" />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
```

### 2. Luồng dữ liệu (bước-by-bước, "gõ 1 chữ")

```
User gõ "a" vào email
   ↓
input fire onChange(e) — e.target.value = "a"
   ↓
setEmail("a") — React đánh dấu component dirty, schedule render (cùng task có thể batch)
   ↓
Re-render: JSX chạy lại → <input value={email} .../> với email = "a"
   ↓
React commit: DOM input cập nhật thành "a" (React so, chỉ đổi khi khác)
```

**Điểm chính**: UI **chỉ phản ánh state**. State không đổi → UI đứng im. Không có "DOM tự giữ một giá trị, state giữ giá trị khác" — **single source of truth**.

### 3. Vì sao gọi "state là nguồn sự thật duy nhất" (điểm ăn điểm)

- Muốn **biết form hiện gì, validate gì, disable nút không** → **chỉ nhìn state**. Không phải "đọc DOM" (uncontrolled mới cần ref).
- Không bao giờ có "trạng thái DOM và state lệch nhau" (bug kinh điển của uncontrolled).
- Nếu bạn **bỏ `onChange` mà giữ `value`** → input **đóng băng** (gõ không vào được). Đây **không phải bug React**, mà là **hệ quả đúng của one-way**: UI chỉ **phản ánh** state, không "đổi ngược" state.

### 4. Submit + validate (control form "đủ" = thêm `onSubmit`)

```tsx
const [err, setErr] = useState("");
const [submitting, setSubmitting] = useState(false);

const submit = (e: React.FormEvent) => {
  e.preventDefault();                 // (1) BẮT BUỘC: chặn reload
  if (submitting) return;            // (2) Chặn bấm kép (nhiều lần click)
  if (!email.includes("@"))          // (3) Validate fail-fast (dừng ngay lỗi đầu)
    return setErr("Email không hợp lệ");
  setSubmitting(true);
  // ...gọi API...
};
```

**Dấu hiệu nên chuyển RHF** (khi "hết đủ"): `err` **trở thành object nhiều field** (lỗi mỗi field riêng), `if` **lồng nhau**, rule **lặp ở nhiều form** → validate tay phình nhanh → **RHF + Zod** (Q18, Q19).

### 5. Đối chiếu Angular (điểm ăn điểm cho người từ Angular)

| Angular | React controlled | Ghi chú |
|---|---|---|
| `FormsModule` + `[(ngModel)]` (two-way "banana-in-a-box") | `value={x}` + `onChange={setX}` | **Tách 2 chiều thành 1 chiều (value) + 1 event (change)** — rõ hơn ở góc độ truy vết |
| `ReactiveFormsModule` + `FormControl` | React **không có sẵn class** tương đương (nguyên tắc: viết bằng `useState`; hoặc RHF) | Angular **có sẵn form engine** (Reactive); React **tự viết bằng state** (hoặc RHF) |
| `validators` (required, email) + `valueChanges` | Validate tay (if) hoặc RHF + Zod (`watch`) | **RHF gần hơn Reactive Forms của Angular** (nhưng gọn hơn, không class) |

> **Nói đúng với interviewer**: controlled là **mô hình dữ liệu đúng** (single source of truth) — **không phải tối ưu hiệu năng** (gõ nhiều field = nhiều render mỗi phím). RHF **giải quyết vấn đề hiệu năng này bằng uncontrolled + ref** (Q18) — **không đổi ngữ nghĩa form** (submit vẫn đúng một nguồn sự thật).

## Bẫy khi phỏng vấn

1. **"Controlled = nhanh / uncontrolled = chậm"** → **sai ở ngược**: controlled = **đúng nguồn sự thật** (single source) nhưng **có giá** re-render mỗi phím; uncontrolled (RHF) = **ít re-render** nhưng **đọc DOM** (ref) khi submit — **trade-off khác** (Q18).
2. **Quên `e.preventDefault()`** → **trang reload** (mất state, app chết). Đây là bug #1 của người mới.
3. **Nhiều field, mỗi field một `useState` (10+ field)** → **code phình** (10 state, 10 setter, validation lồng). Đúng lúc đó là **RHF** (một store form, không phải N state rời).
4. **Uncontrolled thuần (ref) cho form nhiều field** → **khó validate live** (hiện lỗi khi gõ), **khó disable nút theo input** (cần đọc ref mỗi lần). **RHF giải quyết đúng** (uncontrolled nhưng có validate theo field — Q18).

## Gợi ý câu chốt

> "Controlled input = `value` (đọc state) + `onChange` (ghi state) — state là **nguồn sự thật duy nhất**: UI chỉ phản ánh state, không 'gánh' giá trị riêng. Luồng: gõ → onChange → setState → re-render → DOM cập nhật. Giá phải trả: **mỗi phím một re-render** (form nhỏ OK, form lớn lag). `e.preventDefault()` bắt buộc (chặn reload). Khi form lớn + validate phức tạp → RHF + Zod (Q18)."

## Reference

- [`3_react-tutorial/11-forms`](../../3_react-tutorial/11-forms) — controlled + uncontrolled + RHF + Zod (full pattern)
- [`3_react-tutorial/1-jsx-data-display`](../../3_react-tutorial/1-jsx-data-display) — controlled input (DAY 1), one-way data
- Q18 (RHF khác controlled) — vì sao RHF giải quyết vấn đề re-render của controlled thuần

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q18 — vì sao nên dùng react-hook-form?](../18-rhf-vs-controlled/README.md) · [Q19 — form cỡ nào thì RHF đáng tiền?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — Zod + z.infer (1 schema 1 type cho form)?](../35-type-safety/README.md) · [Q28 — form nhiều field liên quan, chuyển useReducer?](../28-usereducer-vs-usestate/README.md)
