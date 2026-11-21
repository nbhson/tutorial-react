// ✅ ĐÚNG: Compiler 1.0 tự lo; chưa có thì tách context hoặc memo
const value = useMemo(() => ({ theme, toggle }), [theme]); // toggle ổn định via useCallback/Compiler
// Hoặc tách ThemeValueContext + ThemeActionsContext
