import { motion, AnimatePresence } from "motion/react"; // npm i motion

function ExitDemo({ open }: { open: boolean }) {
  return (
    // AnimatePresence hoãn xóa node đến khi exit chạy xong (CSS thuần không làm được)
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} // trạng thái lúc mount
          animate={{ opacity: 1, y: 0 }} // trạng thái ổn định
          exit={{ opacity: 0, y: 8 }} // chạy trước khi unmount rồi mới remove
          transition={{ duration: 0.2 }}
        >
          Nội dung có exit mượt
        </motion.div>
      )}
    </AnimatePresence>
  );
}
