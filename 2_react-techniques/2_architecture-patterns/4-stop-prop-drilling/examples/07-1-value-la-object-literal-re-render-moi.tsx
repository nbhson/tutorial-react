// ❌ SAI: reference mới mỗi render
<Ctx.Provider value={{ theme, setTheme }}>
// ✅ ĐÚNG: memo hoặc tách provider
const v = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
<Ctx.Provider value={v}>
