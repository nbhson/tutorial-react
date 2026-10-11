import { useEffect, useEffectEvent, useState } from 'react';

function fakeConnect(roomId: string, onMsg: (m: string) => void) {
  console.log(`[connect] room=${roomId}`);
  const id = setInterval(() => onMsg(`ping từ ${roomId}`), 3000);
  return { disconnect: () => { console.log(`[disconnect] room=${roomId}`); clearInterval(id); } };
}

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const [log, setLog] = useState<string[]>([]);

  // Non-reactive: luôn đọc theme mới nhất, không gây re-connect.
  const onMessage = useEffectEvent((msg: string) => {
    setLog((l) => [...l.slice(-4), `[${theme}] ${msg}`]);
  });

  useEffect(() => {
    const conn = fakeConnect(roomId, onMessage);
    return () => conn.disconnect();
  }, [roomId]); // đổi theme KHÔNG reconnect — xem console

  return (
    <div>
      <p>Room: {roomId} — Theme: {theme}</p>
      <ul>{log.map((m, i) => <li key={i}>{m}</li>)}</ul>
    </div>
  );
}

export default function EffectEventDemo() {
  const [roomId, setRoomId] = useState('general');
  const [theme, setTheme] = useState('sáng');
  return (
    <div>
      <h2>useEffectEvent (React 19.2)</h2>
      <button onClick={() => setRoomId(roomId === 'general' ? 'random' : 'general')}>
        Đổi room (reconnect)
      </button>
      <button onClick={() => setTheme(theme === 'sáng' ? 'tối' : 'sáng')}>
        Đổi theme (không reconnect)
      </button>
      <ChatRoom roomId={roomId} theme={theme} />
    </div>
  );
}
