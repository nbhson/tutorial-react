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
