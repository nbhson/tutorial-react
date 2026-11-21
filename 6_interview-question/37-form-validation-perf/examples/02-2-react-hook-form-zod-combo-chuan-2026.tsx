import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "trùng", path: ["confirm"] });
type FormData = z.infer<typeof schema>;

export function Signup() {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",         // validate khi gõ (không phải khi submit)
    criteriaMode: "firstError", // chỉ show lỗi đầu tiên (đỡ "nổ đỏ" cả form)
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email?.message && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
