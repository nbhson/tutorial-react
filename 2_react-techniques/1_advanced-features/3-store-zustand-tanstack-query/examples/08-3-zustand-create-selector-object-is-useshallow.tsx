import { useShallow } from 'zustand/react/shallow';

// ✅ ĐÚNG: nhiều field mà không render thừa — so shallow thay vì Object.is
const { a, b } = useUi(useShallow((s) => ({ a: s.a, b: s.b })));
