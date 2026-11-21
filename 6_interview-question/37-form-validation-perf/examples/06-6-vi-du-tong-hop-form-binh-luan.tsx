// app/actions.ts
"use server";
const CommentSchema = z.object({
  body: z.string().min(3, "Ít nhất 3 ký tự").max(500, "Tối đa 500 ký tự"),
});
export type CommentState = { errors: { body?: string[] } | null; ok: boolean };

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const parsed = CommentSchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, ok: false };
  await db.comment.create({ data: parsed.data });
  revalidatePath("/post/1");           // data mới vào lần render sau
  return { errors: null, ok: true };
}
