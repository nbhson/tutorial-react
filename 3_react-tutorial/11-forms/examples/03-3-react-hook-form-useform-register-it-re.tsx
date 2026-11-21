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
