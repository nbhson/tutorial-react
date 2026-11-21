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
