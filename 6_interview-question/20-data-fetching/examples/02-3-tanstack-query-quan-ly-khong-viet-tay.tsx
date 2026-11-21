const { data, isPending, error, refetch } = useQuery({
  queryKey: ["users", page],            // địa chỉ cache + dedupe (cùng key = 1 request)
  queryFn: () => fetch(`/api/users?page=${page}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);   // vẫn phải throw
    return r.json();
  }),
  staleTime: 30_000,   // 30s "tươi": remount trong 30s = hiện cache ngay, không fetch
  retry: 2,            // lỗi mạng tự retry (không retry AbortError)
});
