// Cross-field: confirm khớp pass — Angular phải validator tay, Zod .refine:
const Schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  pass: z.string().min(6, "Tối thiểu 6 ký tự"),
  confirm: z.string(),
}).refine((d) => d.confirm === d.pass, { message: "Xác nhận không khớp", path: ["confirm"] });

// Số từ input number là string -> coerce (bẫy số 1):
const NumSchema = z.object({ age: z.coerce.number().min(0) }); // "20" -> 20, không fail
