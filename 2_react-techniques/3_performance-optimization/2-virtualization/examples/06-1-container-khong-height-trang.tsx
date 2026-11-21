// ❌ SAI: không height — không scroll, virtualizer không tính
<div ref={parentRef} style={{ overflow: 'auto' }}>
// ✅ ĐÚNG: height hữu hạn
<div ref={parentRef} style={{ height: 300, overflow: 'auto' }}>
