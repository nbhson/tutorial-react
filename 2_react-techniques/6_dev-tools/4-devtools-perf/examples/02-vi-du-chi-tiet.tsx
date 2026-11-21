// Đo render bằng User Timing API — hiện trên Chrome Performance
import { addProfile } from 'react-render-tracking';
import { memo, useProfiler } from 'react';

export function MeasuredList({ names }: { names: string[] }) {
  const onRender = () => {
    performance.mark('list-end');
    performance.measure('list-render', 'list-start', 'list-end');
  };
  performance.mark('list-start');
  queueMicrotask(onRender); // đo xong sau khi render lần này đã commit

  return (
    <ul>
      {names.map((n) => (
        <UserRow key={n} name={n} />
      ))}
    </ul>
  );
}
