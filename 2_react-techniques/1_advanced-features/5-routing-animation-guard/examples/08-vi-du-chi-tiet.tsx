// ✅ ĐÚNG: tôn trọng người dùng nhạy cảm chuyển động
import { useReducedMotion } from 'motion/react';
export function AnimatedOutletA11y() {
  const giam = useReducedMotion(); // true khi OS bật "giảm chuyển động"
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={giam ? false : { opacity: 0, y: 8 }} // giảm motion → hiện ngay, không fade/slide
        animate={{ opacity: 1, y: 0 }}
        exit={giam ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: giam ? 0 : 0.18 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
