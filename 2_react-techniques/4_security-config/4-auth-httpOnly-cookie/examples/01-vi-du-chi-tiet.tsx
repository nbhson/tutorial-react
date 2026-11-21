import { createContext, useContext, useEffect, useState } from 'react';

// Chỉ giữ thông tin user hiển thị — KHÔNG giữ token
type Me = { id: number; name: string; roles: string[] } | null;

const AuthCtx = createContext<{
  me: Me;
  loading: boolean;
  logout: () => Promise<void>;
}>({ me: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  // Đầu phiên: hỏi server "tôi là ai" — cookie httpOnly tự đi kèm
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false)); // luôn tắt loading dù thành công hay lỗi
  }, []);

  const logout = async () => {
    // Server xoá cookie httpOnly; client chỉ dọn state
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setMe(null);
    window.location.assign('/login');
  };

  return <AuthCtx.Provider value={{ me, loading, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
