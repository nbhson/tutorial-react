// Các thành phần guard + animation (React Router v7 + Motion)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react'; // motion.dev — tên mới của framer-motion
import type { ReactNode } from 'react';

// Guard theo role: kiểm tra ở component trước khi render con
// Vì sao ở component: phản xạ tức thì theo state client, không cần roundtrip server
export function RequireRole({
  roles, // danh sách role được phép (ví dụ ['admin'])
  children, // UI chỉ hiện nếu đủ quyền — không đủ thì redirect, không render con
}: {
  roles: string[];
  children: ReactNode;
}) {
  // đọc roles từ localStorage (đơn giản cho demo — production lấy từ context/store sau khi fetch /api/me)
  const myRoles: string[] = JSON.parse(
    localStorage.getItem('roles') ?? '[]', // chưa có thì mảng rỗng → không quyền nào khớp
  );
  const ok = roles.some((r) => myRoles.includes(r)); // có ít nhất 1 role khớp là qua (muốn TẤT CẢ thì dùng every)
  if (!ok) return <Navigate to="/403" replace />; // đá sang 403; replace để Back không quay lại trang cấm
  return <>{children}</>; // đủ quyền thì render con bình thường
}

// AnimatedOutlet: mỗi lần pathname đổi → page cũ exit, page mới enter
export function AnimatedOutlet() {
  const { pathname } = useLocation(); // key cho animation — đổi path là đổi instance
  return (
    <AnimatePresence mode="wait"> {/* chờ exit xong mới mount page mới — không đè 2 trang */}
      <motion.div
        key={pathname} // React tạo instance mới theo route — không key là animation không cháy
        initial={{ opacity: 0, y: 8 }} // trạng thái vào: mờ + đẩy xuống 8px
        animate={{ opacity: 1, y: 0 }} // trạng thái ổn định: rõ + về vị trí 0
        exit={{ opacity: 0, y: -8 }} // trạng thái ra: mờ + trôi lên 8px
        transition={{ duration: 0.18 }} // ngắn để không cảm giác chờ (0.15–0.25s chuẩn)
      >
        <Outlet /> {/* nội dung route hiện tại — mọi page đều đi qua animation này */}
      </motion.div>
    </AnimatePresence>
  );
}
