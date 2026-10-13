import { useActionState } from 'react';

type State = { ok: boolean; message: string };

async function updateName(
  prev: State,
  formData: FormData,
): Promise<State> {
  const name = String(formData.get('name') ?? '').trim();
  await new Promise((r) => setTimeout(r, 800)); // giả lập API
  if (name.length < 2) {
    return { ok: false, message: 'Tên phải từ 2 ký tự trở lên.' };
  }
  return { ok: true, message: `Đã lưu tên: ${name}` };
}

export default function ActionForm() {
  const [state, formAction, isPending] = useActionState(updateName, {
    ok: false,
    message: '',
  });

  return (
    <div>
      <h2>Actions + useActionState (React 19)</h2>
      <form action={formAction}>
        <input name="name" placeholder="Nhập tên..." disabled={isPending} />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
      </form>
      {state.message && (
        <p style={{ color: state.ok ? 'green' : 'red' }}>{state.message}</p>
      )}
    </div>
  );
}
