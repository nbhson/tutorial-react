// Trước: tự tối ưu bằng memo + useMemo
const Row = memo(({ text }: { text: string }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);

// Sau (Compiler 1.0 bật): viết tự nhiên, Compiler tự memo hóa tương đương
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0);
