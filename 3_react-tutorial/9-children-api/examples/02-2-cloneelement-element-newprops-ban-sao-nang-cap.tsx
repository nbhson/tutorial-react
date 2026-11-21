// TabsList trong example.tsx: inject aria + onClick vào mỗi Tab hợp lệ
if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child; // string: giữ nguyên
const value = child.props.value ?? "";
const oldClick = child.props.onClick; // giữ handler gốc của người dùng
return cloneElement(child, {
  "aria-selected": value === active ? "true" : "false", // chồng prop mới
  onClick: () => { oldClick?.(); onSelect(value); }, // GỘP handler cũ + mới
});
