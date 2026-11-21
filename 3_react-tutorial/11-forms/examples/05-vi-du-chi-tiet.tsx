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
