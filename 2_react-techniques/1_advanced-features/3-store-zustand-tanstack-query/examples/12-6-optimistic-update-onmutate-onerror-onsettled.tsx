// ✅ ĐÚNG: thích ngay, lỗi thì hoàn lại, xong thì đồng bộ server
useMutation({
  mutationFn: (id: number) => fetch(`/api/like/${id}`, { method: 'POST' }),
  onMutate: async (id) => {
    const qc = useQueryClient(); // lấy client
    await qc.cancelQueries({ queryKey: ['posts'] }); // dừng fetch đua
    const prev = qc.getQueryData(['posts']); // snapshot để rollback
    qc.setQueryData(['posts'], (cu: any) => cu.map((p: any) => p.id === id ? { ...p, liked: true } : p));
    return { prev }; // trả context cho onError
  },
  onError: (_e, _v, ctx) => useQueryClient().setQueryData(['posts'], ctx?.prev),
  onSettled: () => useQueryClient().invalidateQueries({ queryKey: ['posts'] }),
});
