// ✅ ĐÚNG: chỉ memo item list + component render thường + Profiler chỉ đỏ
const Row = memo(function Row({ text }: { text: string }) { return <li>{text}</li>; });
