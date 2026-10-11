import { useOptimistic, useState } from 'react';

type Msg = { id: string; text: string; pending?: boolean };

async function fakeSend(text: string): Promise<Msg> {
  await new Promise((r) => setTimeout(r, 800));
  if (Math.random() < 0.2) throw new Error('Mạng lỗi, thử lại!');
  return { id: crypto.randomUUID(), text };
}

export default function OptimisticChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState('');
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (current: Msg[], text: string) => [
      ...current,
      { id: `temp-${Date.now()}`, text, pending: true },
    ],
  );

  async function send(formData: FormData) {
    const text = String(formData.get('text') ?? '').trim();
    if (!text) return;
    setError('');
    addOptimistic(text); // hiện ngay tin nhắn mờ
    try {
      const saved = await fakeSend(text);
      setMessages((m) => [...m, saved]);
    } catch {
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
