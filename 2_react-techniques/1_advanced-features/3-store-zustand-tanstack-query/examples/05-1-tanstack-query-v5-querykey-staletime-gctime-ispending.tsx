// ✅ ĐÚNG: key chứa toàn bộ tham số xác định dữ liệu — mỗi id một cache riêng
const { data, isPending, isFetching, isError } = useQuery({
  queryKey: ['users', id], // hash khác nhau theo id → không ghi đè nhau
  queryFn: () => fetch(`/api/users/${id}`).then((r) => {
    if (!r.ok) throw new Error('Fetch failed'); // ném để Query biết mà retry
    return r.json();
  }),
  staleTime: 30_000, // 30s coi là tươi — mount lại trong 30s không fetch lại
});
// Render: isPending → skeleton trắng; có data + isFetching → badge "đang cập nhật" nhẹ
