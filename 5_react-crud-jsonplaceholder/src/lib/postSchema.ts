// Schema validate form (DAY 11 forms + nhóm 4: validate ở biên).
// react-hook-form + zod qua @hookform/resolvers — thay cho validate tay.

import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tiêu đề tối thiểu 3 ký tự.")
    .max(100, "Tiêu đề tối đa 100 ký tự."),
  body: z.string().trim().min(10, "Nội dung tối thiểu 10 ký tự."),
});

export type PostFormValues = z.infer<typeof postSchema>;
