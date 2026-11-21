import { Children, cloneElement, isValidElement } from "react";

function TabsList({ children, active, onSelect }: {
  children: React.ReactNode; active: string; onSelect: (v: string) => void;
}) {
  return (
    <div role="tablist">
      {Children.map(children, (child) => {
        // Bỏ qua text node: string không có props để đọc hay clone
        if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child;
        const value = child.props.value ?? ""; // đọc value từ child gốc
        const oldClick = child.props.onClick; // giữ handler gốc của người dùng
        return cloneElement(child, {
          "aria-selected": value === active, // inject trạng thái active cho a11y
          // Gộp 2 handler: gọi cũ trước (giữ hành vi người dùng), rồi mới chọn tab
          onClick: () => { oldClick?.(); onSelect(value); },
        } as Partial<unknown> as Record<string, unknown>);
      })}
    </div>
  );
}
