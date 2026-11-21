// ✅ ĐÚNG: type rõ ràng, export để reuse
type BadgeProps = { count: number; max?: number };
function Badge({ count, max = 99 }: BadgeProps) { return <span>{count > max ? `${max}+` : count}</span>; }
