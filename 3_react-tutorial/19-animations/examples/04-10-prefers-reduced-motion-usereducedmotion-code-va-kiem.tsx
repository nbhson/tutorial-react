import { motion, useReducedMotion } from "motion/react";

function RespectfulBox({ open }: { open: boolean }) {
  const reduce = useReducedMotion(); // true khi user bật giảm chuyển động ở OS
  return (
    <motion.div
      initial={false}
      // Tôn trọng user: giảm chuyển động thì duration 0 (hiện ngay), đủ nội dung
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      Nội dung vẫn đủ khi tắt animation
    </motion.div>
  );
}
