// ✅ ĐÚNG: 10.000 item nhưng DOM chỉ ~15 node — scroll mượt
const v = useVirtualizer({ count: 10_000, getScrollElement: () => parentRef.current, estimateSize: () => 32, overscan: 5 });
// Chỉ map v.getVirtualItems() — không map toàn bộ items
