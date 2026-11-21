// ❌ SAI: useContext trực tiếp, ngoài Provider thì ctx null -> crash "cannot read value"
const ctx = useContext(TabsCtx); ctx.value;
