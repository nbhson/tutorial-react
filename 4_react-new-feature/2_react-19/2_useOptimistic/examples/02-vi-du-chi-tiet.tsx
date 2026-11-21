// example.tsx — useOptimistic (React 19)
import { useOptimistic, useState } from 'react';

type Msg = { id: string; text: string; pending?: boolean };

async function fakeSend(text: string): Promise<Msg> {
  await new Promise((r) => setTimeout(r, 800));
  if (Math.random() < 0.2) throw new Error('Mạng lỗi, thử lại!'); // 20% lỗi
  return { id: crypto.randomUUID(), text };
}

export default function OptimisticChat() {
  const [messages, setMessages] = useState<Msg[]>([]); // ACTUAL state
  const [error, setError] = useState('');

  // OPTIMISTIC view: bình thường = messages; khi addOptimistic → cập nhật qua updater
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (current: Msg[], text: string): Msg[] => [
      ...current,
      { id: `temp-${Date.now()}`, text, pending: true }, // tin nhắn tạm
    ],
  );

  async function send(formData: FormData) {
    const text = String(formData.get('text') ?? '').trim();
    if (!text) return;
    setError('');
    addOptimistic(text); // 1. hiện ngay, user thấy tức thì
    try {
      const saved = await fakeSend(text);
      setMessages((m) => [...m, saved]); // 2. actual thay optimistic
    } catch {
      // 3. optimistic tự biến mất; chỉ cần hiện lỗi
      setError('Gửi thất bại — tin nhắn lạc quan đã tự rollback.');
    }
  }

  return (
    <div>
      <h2>useOptimistic (React 19)</h2>
      <ul>
        {optimistic.map((m) => (
          <li key={m.id} style={{ opacity: m.pending ? 0.5 : 1 }}>
            {m.text} {m.pending && <em>(đang gửi...)</em>}
          </li>
        ))}
      </ul>
      <form action={send}>
        <input name="text" placeholder="Nhắn gì đó..." />
        <button type="submit">Gửi</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
