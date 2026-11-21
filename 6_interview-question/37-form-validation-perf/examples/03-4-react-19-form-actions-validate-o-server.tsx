// app/actions.ts — SERVER: cùng schema Zod với client
"use server";
const Schema = z.object({ email: z.string().email(), pass: z.string().min(8) });

export async function signup(_prev: State, formData: FormData): Promise<State> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors }; // KHÔNG throw — trả lỗi về form
  }
  await createUser(parsed.data);
  return { errors: null };
}
