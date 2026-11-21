// ✅ ĐÚNG: gộp — gọi cũ rồi mới (như TabsList trong ví dụ)
const old = (child as any).props.onClick;
cloneElement(child, { onClick: () => { old?.(); onSelect(value); } });
