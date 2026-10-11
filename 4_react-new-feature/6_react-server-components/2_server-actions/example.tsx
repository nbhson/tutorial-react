// actions.ts (server):
// 'use server';
// import { revalidatePath } from 'next/cache';
// export async function createTodo(prev: State, formData: FormData): Promise<State> {
//   const title = String(formData.get('title') ?? '').trim();
//   if (!title) return { ok: false, message: 'Thiếu tiêu đề' };
//   await db.todo.create({ title });   // auth + validate ở đây
//   revalidatePath('/todos');
//   return { ok: true, message: `Đã tạo: ${title}` };
// }

'use client';
import { useActionState } from 'react';

type State = { ok: boolean; message: string };

// Mô phỏng Server Action chạy phía server (demo chạy được ở client).
async function createTodo(prev: State, formData: FormData): Promise<State> {
  const title = String(formData.get('title') ?? '').trim();
  await new Promise((r) => setTimeout(r, 600));
  if (!title) return { ok: false, message: 'Thiếu tiêu đề.' };
  // Thực tế: ghi DB + revalidatePath('/todos') ở phía server.
  return { ok: true, message: `Đã tạo todo: ${title}` };
}

export default function TodoActionForm() {
  const [state, formAction, isPending] = useActionState(createTodo, {
    ok: false,
    message: '',
  });

  return (
    <div>
      <h2>Server Actions + useActionState (RSC)</h2>
      <form action={formAction}>
        <input name="title" placeholder="Việc cần làm..." disabled={isPending} />
        <button disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo'}</button>
      </form>
      {state.message && (
        <p style={{ color: state.ok ? 'green' : 'red' }}>{state.message}</p>
      )}
    </div>
  );
}
