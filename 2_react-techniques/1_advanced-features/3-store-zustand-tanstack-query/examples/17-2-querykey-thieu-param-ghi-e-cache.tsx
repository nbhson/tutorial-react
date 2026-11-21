// ❌ SAI: mọi id chung key ['users']
useQuery({ queryKey: ['users'], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
// ✅ ĐÚNG: key chứa id
useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
