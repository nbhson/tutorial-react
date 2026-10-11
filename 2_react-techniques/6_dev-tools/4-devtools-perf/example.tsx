import { memo } from 'react';

// Đặt tên component rõ ràng để flamegraph Profiler dễ đọc
export const UserRow = memo(function UserRow({ name }: { name: string }) {
  return <li>{name}</li>;
});

export function MeasuredList({ names }: { names: string[] }) {
  const onRender = () => {
    performance.mark('list-end');
    performance.measure('list-render', 'list-start', 'list-end');
  };
  performance.mark('list-start');
  queueMicrotask(onRender);
  return (
    <ul>
      {names.map((n) => (
        <UserRow key={n} name={n} />
      ))}
    </ul>
  );
}
