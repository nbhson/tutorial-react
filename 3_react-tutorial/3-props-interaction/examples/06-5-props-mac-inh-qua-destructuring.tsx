// Badge trong example.tsx: number props + default max
type BadgeProps = { count: number; max?: number };
function Badge({ count, max = 99 }: BadgeProps) {
  return <span>[Thông báo: {count > max ? `${max}+` : count}]</span>;
}
// <Badge count={count} /> -> max = 99; <Badge count={150} max={99} /> -> "99+"
