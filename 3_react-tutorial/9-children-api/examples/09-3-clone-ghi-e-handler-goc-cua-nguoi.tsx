// ❌ SAI: mất onClick gốc (ví dụ analytics ở nơi khai báo)
cloneElement(child, { onClick: () => onSelect(value) });
