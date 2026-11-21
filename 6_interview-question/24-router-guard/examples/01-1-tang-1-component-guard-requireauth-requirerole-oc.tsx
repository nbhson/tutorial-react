import { Navigate } from "react-router-dom";

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { roles: myRoles } = useAuth();              // từ Context/Zustand (root loader, 1 lần)
  const ok = roles.some((r) => myRoles.includes(r));  // cần 1 trong các role
  if (!ok) return <Navigate to="/403" replace />;     // ← redirect lần RENDER ĐẦU
  return <>{children}</>;
}
