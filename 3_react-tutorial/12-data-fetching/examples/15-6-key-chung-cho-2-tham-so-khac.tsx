// ❌ SAI: page 1 và 2 cùng key -> page 2 hiện cache page 1
useQuery({ queryKey: ["users"], queryFn: () => fetch(`/api/users?page=${page}`) });
