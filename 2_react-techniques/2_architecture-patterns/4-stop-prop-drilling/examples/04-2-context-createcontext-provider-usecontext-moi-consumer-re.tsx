// ❌ SAI: value literal mới mỗi render — mọi consumer re-render dù theme không đổi
function App({ theme }: any) { return <Ctx.Provider value={{ theme }}>{children}</Ctx.Provider>; }
// ✅ ĐÚNG: memo value — reference ổn định
function App({ theme }: any) {
  const v = useMemo(() => ({ theme }), [theme]); // chỉ đổi khi theme đổi thật
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
