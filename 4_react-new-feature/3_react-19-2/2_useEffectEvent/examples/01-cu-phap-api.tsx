import { useEffect, useEffectEvent } from 'react';

function Chat({ roomId, theme }: { roomId: string; theme: string }) {
  // Effect Event: luôn đọc theme mới nhất, identity ổn định
  const onMessage = useEffectEvent((msg: string) => {
    showToast(`[${theme}] ${msg}`);
  });

  useEffect(() => {
    const conn = connect(roomId, onMessage); // dùng event trong Effect
    return () => conn.disconnect();
  }, [roomId]); // chỉ roomId — KHÔNG thêm onMessage/theme
}
