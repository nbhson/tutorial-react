// ❌ SAI (khi chưa Compiler, data lớn): mọi consumer render lại dù value không đổi
<TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>
