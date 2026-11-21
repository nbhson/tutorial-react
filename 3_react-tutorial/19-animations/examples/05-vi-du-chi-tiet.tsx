// Motion (npm i motion) — exit cho conditional unmount:
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
      Nội dung
    </motion.div>
  )}
</AnimatePresence>
