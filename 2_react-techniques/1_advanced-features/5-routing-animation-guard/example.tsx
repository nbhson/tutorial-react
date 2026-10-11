import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

export function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const myRoles: string[] = JSON.parse(
    localStorage.getItem('roles') ?? '[]',
  );
  const ok = roles.some((r) => myRoles.includes(r));
  if (!ok) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export function AnimatedOutlet() {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
