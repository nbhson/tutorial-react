// ❌ SAI: rows tạo mới mỗi render -> deps luôn khác -> vừa so vừa tính lại, tốn đôi
function App() {
  const rows = [120000, 45000, 89000]; // mới mỗi render
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
}
