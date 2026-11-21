import { motion } from "motion/react";

function NoMountFlash({ open }: { open: boolean }) {
  return (
    // initial={false}: lần mount đầu hiện ngay, chỉ animate từ lần toggle sau
    <motion.div initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }}>
      Nội dung không flash lúc mở trang
    </motion.div>
  );
}
