import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualDemo() {
  const items = Array.from({ length: 10_000 }, (_, i) => `Dòng #${i + 1}`);
  const parentRef = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });
  return (
    <div ref={parentRef} style={{ height: 300, overflow: 'auto', border: '1px solid #ccc' }}>
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              height: 32, transform: `translateY(${vi.start}px)`,
            }}
          >
            {items[vi.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
