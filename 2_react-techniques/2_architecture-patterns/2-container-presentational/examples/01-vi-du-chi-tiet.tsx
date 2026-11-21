// ---------- Presentational: thuần props, không fetch ----------
// Nhận đủ dữ liệu + callback; test bằng props giả không cần mock fetch
export type UserViewProps = {
  name: string;
  email: string;
  selected: boolean;
  onSelect: () => void;
};

export function UserCardView({ name, email, selected, onSelect }: UserViewProps) {
  return (
    <button
      onClick={onSelect}                  // tương tác "khai báo" qua callback
      aria-pressed={selected}             // accessibility: nút toggle chọn
      style={{ border: selected ? '2px solid blue' : '1px solid gray' }}
    >
      <strong>{name}</strong>             {/* chỉ render, không suy nghĩ */}
      <span>{email}</span>
    </button>
  );
}

// ---------- Container: quản lý state chọn ----------
import { useState } from 'react';

// Container lo "chọn ai", view không cần biết state từ đâu ra
export function UserCardContainer(props: Omit<UserViewProps, 'selected' | 'onSelect'>) {
  const [selected, setSelected] = useState(false); // state local của container
  return (
    <UserCardView
      {...props}                                   // truyền name/email nguyên vẹn
      selected={selected}
      onSelect={() => setSelected((s) => !s)}      // toggle khi bấm
    />
  );
}
