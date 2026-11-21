import { memo } from 'react';

// Đặt tên rõ ràng để flamegraph dễ đọc (thay vì "Anonymous")
export const UserRow = memo(function UserRow({ name }: { name: string }) {
  return <li>{name}</li>;
});
