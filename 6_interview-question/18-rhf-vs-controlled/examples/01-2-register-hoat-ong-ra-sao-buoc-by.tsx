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
