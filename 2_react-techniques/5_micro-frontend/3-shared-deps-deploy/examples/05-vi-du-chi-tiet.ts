// host/RouteSync.tsx — lắng nghe remote đổi path để đồng bộ URL (custom event)
// Vì sao event: remote nav nội bộ (memory) host không biết — bắn event để URL thật theo kịp, giữ deep-link
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useRemotePathSync(appName: string) {
  const navigate = useNavigate();
  useEffect(() => {
    // Remote bắn 'remote:nav:shop' khi tự điều hướng nội bộ (ví dụ / → /checkout)
    const onNav = (e: Event) => {
      const { path } = (e as CustomEvent).detail; // path mới trong remote
      navigate(path); // host cập nhật URL thật + có thể deep-link/Back được
    };
    window.addEventListener(`remote:nav:${appName}`, onNav);
    return () => window.removeEventListener(`remote:nav:${appName}`, onNav); // dọn để không leak chéo app
  }, [navigate, appName]);
}
