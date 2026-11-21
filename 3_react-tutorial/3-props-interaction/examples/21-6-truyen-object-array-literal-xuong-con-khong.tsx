// ✅ ĐÚNG: với Compiler 1.0 cứ viết tự nhiên, Compiler tự memo; nếu chưa có Compiler mới cần useMemo
// Có Compiler: <MemoChild style={{ color: "red" }} /> — ổn, Compiler lo
// Chưa có: const style = useMemo(() => ({ color: "red" }), []); <MemoChild style={style} />
