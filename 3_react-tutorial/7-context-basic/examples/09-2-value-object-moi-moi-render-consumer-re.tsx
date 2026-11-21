// ❌ SAI (data đổi nhanh, chưa Compiler): theme không đổi nhưng Provider render vì lý do khác vẫn làm consumer render
<ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
