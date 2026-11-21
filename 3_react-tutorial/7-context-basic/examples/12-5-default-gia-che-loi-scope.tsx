// ✅ ĐÚNG: null + throw để lộ ngay
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);
