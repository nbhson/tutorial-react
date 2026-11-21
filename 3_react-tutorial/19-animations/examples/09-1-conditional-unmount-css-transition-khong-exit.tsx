// ✅ ĐÚNG: giữ DOM (opacity) cho CSS 2 chiều, hoặc AnimatePresence cho exit gỡ hẳn
{<div style={{ opacity: open ? 1 : 0, transition: "opacity 200ms" }}>Hi</div>}
// Hoặc Motion:
<AnimatePresence>{open && <motion.div exit={{ opacity: 0 }}>Hi</motion.div>}</AnimatePresence>
