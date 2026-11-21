import { useQuery } from '@tanstack/react-query';
export function UserCardContainer({ id }: { id: number }) {
  const { data, isPending } = useQuery({
    queryKey: ['users', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  });
  if (isPending) return <p>Đang tải…</p>; // container quyết định trạng thái
  return <UserCardView name={data.name} email={data.email}
           selected={false} onSelect={() => console.log(id)} />;
}
