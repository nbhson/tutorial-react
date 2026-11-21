// ✅ ĐÚNG: Compiler 1.0 tự lo; chưa có thì tách context hoặc useMemo
const value = useMemo(() => ({ value, setValue }), [value]); // setValue ổn định
// Hoặc tách TabsValueContext + TabsActionsContext
