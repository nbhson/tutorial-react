// ✅ ĐÚNG: key đủ chi tiết
useQuery({ queryKey: ["users", page], queryFn: () => fetch(`/api/users?page=${page}`) });
