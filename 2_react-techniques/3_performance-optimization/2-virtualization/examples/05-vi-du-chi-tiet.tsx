// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualDemo() {
  // 10.000 phần tử — đủ thấy khác biệt so với render tất cả (50.000 node vs ~75 node)
  const items = Array.from({ length: 10_000 }, (_, i) => `Dòng #${i + 1}`);
  const parentRef = useRef<HTMLDivElement>(null); // scroll container — virtualizer đọc scrollTop ở đây

  // useVirtualizer: tính "cửa sổ hiển thị" dựa trên scroll position
  // Vì sao 4 option này: count để biết tổng, getScrollElement để biết đọc ở đâu,
  // estimateSize để có cao khởi đầu, overscan để scroll nhanh không trắng
  const v = useVirtualizer({
    count: items.length, // tổng số dòng — filter/append thì số này đổi, virtualizer tính lại
    getScrollElement: () => parentRef.current, // lấy container cuộn (ref ổn định)
    estimateSize: () => 32, // ước 32px/row — đúng vì demo mọi row cùng cao
    overscan: 5, // render thêm 5 dòng 2 đầu cho mượt khi scroll nhanh
  });

  return (
    // Container BẮT BUỘC có height hữu hạn + overflow auto — không có là không cuộn, list trắng
    <div ref={parentRef} style={{ height: 300, overflow: 'auto', border: '1px solid #ccc' }}>
      {/* "canvas" ảo: cao đúng tổng (getTotalSize) để thanh cuộn dài như list thật, position relative làm mốc */}
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {/* chỉ render đúng số dòng trong viewport + overscan — không map toàn bộ items */}
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key} // key ổn định từ virtualizer — KHÔNG dùng index render, sort/filter là lệch
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              height: 32, // khớp estimateSize (row động thì dùng vi.size + measureElement)
              transform: `translateY(${vi.start}px)`, // định vị theo offset — dùng transform để chỉ composite, nhanh hơn top
            }}
          >
            {items[vi.index]} {/* lấy nội dung theo index ảo — vi.index là vị trí data thật */}
          </div>
        ))}
      </div>
    </div>
  );
}
