// ✅ ĐÚNG: media query toàn cục + useReducedMotion() cho logic (xem mẫu trên)
// CSS: @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }
// Motion: const reduce = useReducedMotion(); <motion.div animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }} />
