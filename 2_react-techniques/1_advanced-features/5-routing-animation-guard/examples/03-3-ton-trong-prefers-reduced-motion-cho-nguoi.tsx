// ✅ ĐÚNG: tắt animation khi user yêu cầu giảm chuyển động
import { useReducedMotion } from 'motion/react';
const giam = useReducedMotion(); // true khi OS bật reduce motion
<motion.div initial={giam ? false : { opacity: 0 }} animate={{ opacity: 1 }} />
