// ❌ Một context "ôm" "tất cả" — "đổi" "theme" "kéo" "locale" "render" "lẫn"
const AppCtx = createContext<{ theme: Theme; locale: string; user: User }>(...);

// ✅ Tách "theo" "mối quan tâm" — "đổi" "cái nào render" "cái" "đó"
const ThemeCtx = createContext<Theme>(...);
const LocaleCtx = createContext<string>(...);
