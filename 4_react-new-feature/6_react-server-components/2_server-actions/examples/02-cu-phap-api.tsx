// Client Component
'use client';
import { useActionState } from 'react';
import { createTodo } from './actions';

export function TodoForm() {
  const [state, formAction, isPending] = useActionState(createTodo, {
    ok: false,
    message: '',
  });
  return (
    <form action={formAction}>
      <input name="title" disabled={isPending} />
      <button disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo'}</button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
