// ✅ ĐÚNG: viết trần, tuân rules — Compiler tự memo, không cần useMemo/useCallback
function Chao({ ten }: { ten: string }) {
  const loiChao = `Xin chào, ${ten}!`; // dẫn xuất thuần — Compiler tự cache
  return <p>{loiChao}</p>; // cha re-render mà ten không đổi → Compiler bỏ qua render này
}
