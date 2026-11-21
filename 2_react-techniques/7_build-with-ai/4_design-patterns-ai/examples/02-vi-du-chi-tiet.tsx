// Form AI + Server Actions (Next.js) — validation server + trạng thái submit
import { useActionState } from 'react';

async function askAction(prev: { answer?: string; error?: string }, formData: FormData) {
  const q = formData.get('question'); // đọc dữ liệu form ở server
  if (!q || String(q).trim().length < 10) {
    return { error: 'Câu hỏi quá ngắn (tối thiểu 10 ký tự).' }; // validation server
  }
  const answer = await askAI(String(q)); // gọi model ở server — giữ key bí mật
  return { answer };
}

export function AskForm() {
  const [state, formAction, isPending] = useActionState(askAction, {});
  return (
    <form action={formAction}>
      <label htmlFor="q">Hỏi AI</label>
      <input id="q" name="question" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Đang hỏi…' : 'Gửi'}
      </button>
      {state.answer && <AiAnswer work={Promise.resolve(state.answer)} />}
    </form>
  );
}
