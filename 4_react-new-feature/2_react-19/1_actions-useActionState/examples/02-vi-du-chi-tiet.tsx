// example.tsx — Actions + useActionState (React 19)
import { useActionState } from 'react';

type State = { ok: boolean; message: string };

// Action: nhận prevState + FormData, trả nextState.
// Không throw để báo lỗi — trả { ok: false } và render message.
async function updateName(prev: State, formData: FormData): Promise<State> {
  const name = String(formData.get('name') ?? '').trim(); // đọc field "name"
  await new Promise((r) => setTimeout(r, 800));           // giả lập API
  if (name.length < 2) {
    return { ok: false, message: 'Tên phải từ 2 ký tự trở lên.' }; // lỗi → state lỗi
  }
  return { ok: true, message: `Đã lưu tên: ${name}` };             // thành công
}

export default function ActionForm() {
  const [state, formAction, isPending] = useActionState(updateName, {
    ok: false,
    message: '',      // initialState hiển thị trước
  });

  return (
    <div>
      <h2>Actions + useActionState (React 19)</h2>
      <form action={formAction}>
        <input name="name" placeholder="Nhập tên..." disabled={isPending} />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu'}   {/* pending → đổi label */}
        </button>
      </form>
      {state.message && (
        <p style={{ color: state.ok ? 'green' : 'red' }}>{state.message}</p>
      )}
    </div>
  );
}
