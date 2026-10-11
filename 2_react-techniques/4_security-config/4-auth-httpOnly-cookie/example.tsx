import { createContext, useContext, useEffect, useState } from 'react';

type Me = { id: number; name: string; roles: string[] } | null;

const AuthCtx = createContext<{
  me: Me;
  loading: boolean;
  logout: () => Promise<void>;
}>({ me: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setMe(null);
    window.location.assign('/login');
  };

  return <AuthCtx.Provider value={{ me, loading, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
