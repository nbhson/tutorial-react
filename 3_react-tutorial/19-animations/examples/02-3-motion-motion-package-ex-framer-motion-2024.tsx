// Motion (npm i motion) — exit chạy trước khi gỡ DOM (CSS không làm được vì DOM gỡ ngay):
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }} // mount từ đâu
      animate={{ opacity: 1, y: 0 }} // tới đâu
      exit={{ opacity: 0, y: 8 }} // rời đi đâu — AnimatePresence giữ tới khi xong mới gỡ
      transition={{ duration: 0.2 }}
    >Nội dung</motion.div>
  )}
</AnimatePresence>
