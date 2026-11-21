// features/todos/actions.ts  — file server
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type State = { ok: boolean; message: string };

export async function createTodo(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const user = await auth(); // ✅ kiểm tra auth TRÊN SERVER
  if (!user) return { ok: false, message: 'Chưa đăng nhập' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { ok: false, message: 'Thiếu tiêu đề' }; // ✅ validate server

  await db.todo.create({ title, userId: user.id });
  revalidatePath('/todos'); // refresh dữ liệu trang /todos
  return { ok: true, message: `Đã tạo: ${title}` };
  // redirect('/todos'); // (tùy chọn) điều hướng
}
