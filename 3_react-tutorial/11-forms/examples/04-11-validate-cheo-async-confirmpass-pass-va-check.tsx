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
