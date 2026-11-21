// ❌ SAI: getScrollElement tạo element mới mỗi lần — virtualizer mất mốc đo
getScrollElement: () => document.createElement('div'),
// ✅ ĐÚNG: trả ref ổn định
getScrollElement: () => parentRef.current,
