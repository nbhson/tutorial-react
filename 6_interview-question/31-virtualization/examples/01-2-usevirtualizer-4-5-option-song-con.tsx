import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const v = useVirtualizer({
    count: items.length,                    // (1) tổng item — đổi khi filter/append
    getScrollElement: () => parentRef.current, // (2) ref ổn định (KHÔNG createElement mỗi lần)
    estimateSize: () => 32,                 // (3) ước cao mỗi row (trước khi đo thật)
    overscan: 5,                            // (4) đệm 5 dòng 2 đầu (scroll nhanh không trắng)
  });

  return (
    <div ref={parentRef} style={{ height: 300, overflow: "auto", border: "1px solid #ccc" }}>
      {/* (5) "canvas" cao đúng tổng (getTotalSize) — thanh cuộn dài như list thật */}
      <div style={{ height: v.getTotalSize(), position: "relative" }}>
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key}                    // key ổn định (KHÔNG index render — sort/filter lệch, Q8)
            data-index={vi.index}
            ref={v.measureElement}          // (6) row cao động: đo thật (không phải chỉ estimate)
            style={{
              position: "absolute", top: 0, left: 0, width: "100%",
              height: vi.size,
              transform: `translateY(${vi.start}px)`, // composite (nhanh), không layout
            }}
          >
            {items[vi.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
