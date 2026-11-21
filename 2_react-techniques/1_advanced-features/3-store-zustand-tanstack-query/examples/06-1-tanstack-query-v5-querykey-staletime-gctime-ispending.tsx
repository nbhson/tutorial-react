// ❌ SAI: key thiếu id — user 1 và user 2 dùng chung cache, mở user 2 thấy data user 1
useQuery({ queryKey: ['users'], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });

// ✅ ĐÚNG: đưa id vào key
useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
