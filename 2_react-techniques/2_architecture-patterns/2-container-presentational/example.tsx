// Presentational: thuần props, không fetch
export type UserViewProps = {
  name: string;
  email: string;
  selected: boolean;
  onSelect: () => void;
};

export function UserCardView({ name, email, selected, onSelect }: UserViewProps) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      style={{ border: selected ? '2px solid blue' : '1px solid gray' }}
    >
      <strong>{name}</strong>
      <span>{email}</span>
    </button>
  );
}

// Container: quản lý state chọn
import { useState } from 'react';

export function UserCardContainer(props: Omit<UserViewProps, 'selected' | 'onSelect'>) {
  const [selected, setSelected] = useState(false);
  return (
    <UserCardView {...props} selected={selected} onSelect={() => setSelected((s) => !s)} />
  );
}
