// ✅ ĐÚNG: selector nguyên thủy riêng, hoặc useShallow so nông (Zustand v5)
const a = useCart((s) => s.a); const b = useCart((s) => s.b);
import { useShallow } from "zustand/react/shallow";
const { a, b } = useCart(useShallow((s) => ({ a: s.a, b: s.b })));
