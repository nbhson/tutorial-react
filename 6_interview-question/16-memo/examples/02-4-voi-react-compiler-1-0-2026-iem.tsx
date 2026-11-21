// Trước (không Compiler — "tay"):
const Row = memo(({ text }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
const stable = useCallback((x) => setX(x), []);

// Sau (Compiler 1.0 bật — "viết tự nhiên"):
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0); // "tính lại chỉ khi rows đổi" (Compiler lo)
const stable = (x) => setX(x); // "Compiler giữ tham chiếu ổn định" (giúp effect deps)
