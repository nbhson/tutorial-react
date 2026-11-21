// ✅ ĐÚNG: row cao động — đo thật + key ổn định
const v = useVirtualizer({ count: items.length, getScrollElement: () => parentRef.current, estimateSize: () => 40, getItemKey: (i) => items[i].id });
{v.getVirtualItems().map((vi) => (
  <div key={vi.key} data-index={vi.index} ref={v.measureElement} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}>
    {items[vi.index].noiDungDai}
  </div>
))}
