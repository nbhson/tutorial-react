// example.tsx dùng đúng pattern này:
function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>");
  return ctx;
}
// Dùng sai: <ThemedButton /> ngoài Provider -> throw ngay lúc render,
// stack trace chỉ đúng component thiếu bọc — sửa bằng cách bọc <ThemeProvider>
