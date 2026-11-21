const deletePost = useMutation({
  mutationFn: (id: number) => api.delete(`/posts/${id}`),

  // (1) TRƯỚC khi gọi API: "cố" cache + "giữ" snapshot (để rollback)
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: postsKeys.list(limit) });  // "BẮT BUỘC" (bẫy §4)
    const snapshot = qc.getQueryData<Post[]>(postsKeys.list(limit)); // "GIỮ" bản cũ
    qc.setQueryData<Post[]>(postsKeys.list(limit), (old) =>
      old?.filter((p) => p.id !== id) ?? old,                       // "PHỎNG ĐOÁN" (hiện ngay)
    );
    return { snapshot };       // (2) error → dùng snapshot (rollback)
  },

  // (3) LỖI: khôi phục cache (rollback) + refetch thật (sửa sai)
  onError: (_e, _id, ctx) => {
    qc.setQueryData(postsKeys.list(limit), ctx!.snapshot);          // "ĐƯA VỀ" bản cũ
    qc.invalidateQueries({ queryKey: postsKeys.list(limit) });     // "HỎI LẠI" server (đúng)
  },

  // (4) DÙ thành công hay lỗi: invalidate (thành công thì "xác nhận" cache, lỗi thì "đã rollback + sửa")
  onSettled: () => qc.invalidateQueries({ queryKey: postsKeys.list(limit) }),
});
