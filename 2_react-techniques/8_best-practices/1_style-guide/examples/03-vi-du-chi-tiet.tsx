// UserCard.tsx — ref như prop thường (React 19), không forwardRef
export type UserCardProps = {
  user: { id: number; name: string };
  onSelect: (id: number) => void;
  ref?: React.Ref<HTMLButtonElement>;
};

export function UserCard({ user, onSelect, ref }: UserCardProps) {
  return (
    <button ref={ref} type="button" onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}
