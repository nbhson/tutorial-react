import { motion } from "motion/react";

function SortablePreview({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((it) => (
        // layout: đổi thứ tự mảng là item trượt về vị trí mới, không nhảy cục
        // key ổn định (DAY 2/20) là bắt buộc để Motion biết item nào đi đâu
        <motion.li key={it} layout transition={{ duration: 0.2 }}>
          {it}
        </motion.li>
      ))}
    </ul>
  );
}
